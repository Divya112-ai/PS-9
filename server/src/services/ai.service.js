const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const logger = require('../utils/logger');
const { classifyByRules } = require('./classification.service');

// ─────────────────────────────────────────────
// Model fallback chain — tries in order
// ─────────────────────────────────────────────
const GEMINI_MODELS = [
  'gemini-3.6-flash',        // Primary — newest, best quality
  'gemini-flash-latest',     // Always-current stable
  'gemini-3.5-flash',        // Previous stable
  'gemini-3.7-flash',        // Backup
];

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 1500;

const VALID_TYPES = ['fire', 'flood', 'medical', 'accident', 'industrial', 'structural', 'other'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const VALID_PRIORITIES = ['P1', 'P2', 'P3', 'P4'];

// Lazily initialize client
let genAI = null;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// ─────────────────────────────────────────────
// Schema — forces valid JSON
// ─────────────────────────────────────────────
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    type: { type: SchemaType.STRING, enum: VALID_TYPES },
    severity: { type: SchemaType.STRING, enum: VALID_SEVERITIES },
    priority: { type: SchemaType.STRING, enum: VALID_PRIORITIES },
    confidence: { type: SchemaType.NUMBER },
    summary: { type: SchemaType.STRING },
    recommendedActions: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['type', 'severity', 'priority', 'confidence', 'summary', 'recommendedActions'],
};

const SYSTEM_INSTRUCTION = `You are an emergency incident classifier for a city emergency response system.

Analyze the citizen report and classify it according to the schema.

Priority mapping: P1=critical, P2=high, P3=medium, P4=low.

Rules:
- NEVER invent resource IDs, truck numbers, or specific units.
- NEVER claim any emergency service has been contacted.
- Summary must be a single short sentence under 120 characters.
- Recommended actions must be 2-4 short imperative phrases.
- confidence must be a number between 0 and 1.`;

const buildPrompt = (description, location) => {
  const locStr = location?.coordinates
    ? `[lng: ${location.coordinates[0]}, lat: ${location.coordinates[1]}]`
    : 'unknown';
  return `Classify this emergency report.\n\nReport: "${description}"\nLocation: ${locStr}`;
};

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────
const validateAiResponse = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  if (!VALID_TYPES.includes(raw.type)) return null;
  if (!VALID_SEVERITIES.includes(raw.severity)) return null;
  if (!VALID_PRIORITIES.includes(raw.priority)) return null;

  const expectedPriority = { critical: 'P1', high: 'P2', medium: 'P3', low: 'P4' }[raw.severity];
  if (raw.priority !== expectedPriority) raw.priority = expectedPriority;

  const conf = Number(raw.confidence);
  raw.confidence = Number.isNaN(conf) || conf < 0 || conf > 1 ? 0.5 : conf;

  if (typeof raw.summary !== 'string' || !raw.summary.trim()) {
    raw.summary = 'AI-generated classification.';
  }
  raw.summary = raw.summary.slice(0, 200).replace(/\s+/g, ' ').trim();

  if (!Array.isArray(raw.recommendedActions)) raw.recommendedActions = [];
  raw.recommendedActions = raw.recommendedActions
    .filter((a) => typeof a === 'string' && a.trim())
    .map((a) => a.trim().slice(0, 150))
    .slice(0, 5);
  if (raw.recommendedActions.length === 0) {
    raw.recommendedActions = ['Assess situation', 'Dispatch appropriate team'];
  }
  return raw;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────
// Is error retryable? (503 = temporary overload)
// ─────────────────────────────────────────────
const isRetryableError = (err) => {
  const msg = err?.message || '';
  return (
    msg.includes('503') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('temporarily') ||
    msg.includes('429') ||         // rate limit
    msg.includes('timed out')
  );
};

// ─────────────────────────────────────────────
// Try one model with retries
// ─────────────────────────────────────────────
const tryModel = async (client, modelName, description, location) => {
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  let lastErr = null;

  for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
    try {
      logger.debug(`[${modelName}] attempt ${attempt}/${MAX_RETRIES_PER_MODEL}`);

      const result = await Promise.race([
        model.generateContent(buildPrompt(description, location)),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timed out')), REQUEST_TIMEOUT_MS)
        ),
      ]);

      const rawText = result?.response?.text?.();
      if (!rawText) throw new Error('Empty response');

      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      const validated = validateAiResponse(parsed);
      if (!validated) throw new Error('Failed validation');

      return validated; // ✅ Success
    } catch (err) {
      lastErr = err;
      const retryable = isRetryableError(err);

      logger.debug(`[${modelName}] attempt ${attempt} failed: ${err.message}`);

      // Don't retry on non-retryable errors (like invalid JSON from a working model)
      if (!retryable || attempt === MAX_RETRIES_PER_MODEL) break;

      // Wait before retry
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw lastErr || new Error('All attempts failed');
};

// ─────────────────────────────────────────────
// Main entry: try each model in fallback chain
// ─────────────────────────────────────────────
const classifyWithAI = async (description, location = null) => {
  const startTime = Date.now();

  const client = getClient();
  if (!client) {
    logger.warn('GEMINI_API_KEY missing — using rule fallback');
    return { ...classifyByRules(description), source: 'rules_fallback' };
  }

  const errors = [];

  for (const modelName of GEMINI_MODELS) {
    try {
      const validated = await tryModel(client, modelName, description, location);
      const elapsedMs = Date.now() - startTime;

      logger.info(`Gemini success via ${modelName}`, {
        type: validated.type,
        severity: validated.severity,
        elapsedMs,
      });

      return { ...validated, source: 'ai', model: modelName, elapsedMs };
    } catch (err) {
      errors.push(`${modelName}: ${err.message}`);
      logger.debug(`Model ${modelName} failed entirely — trying next`);
      // Continue to next model
    }
  }

  // All models failed → fallback to rules
  const elapsedMs = Date.now() - startTime;
  logger.warn(`All Gemini models failed after ${elapsedMs}ms — using rules`, {
    errors,
  });

  return {
    ...classifyByRules(description),
    source: 'rules_fallback',
    fallbackReason: 'All Gemini models failed',
    modelErrors: errors,
  };
};

module.exports = { classifyWithAI };