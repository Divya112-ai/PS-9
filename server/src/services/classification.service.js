/**
 * Rule-based incident classifier.
 *
 * This is the deterministic fallback used when the AI service is
 * unavailable. It also serves as the semantic framework the AI
 * must conform to (same categories, severities, priorities).
 */

// ─────────────────────────────────────────────
// Type keywords — order matters (higher priority first)
// A description matching keywords from multiple categories picks the first.
// ─────────────────────────────────────────────
const TYPE_RULES = [
  {
    type: 'fire',
    keywords: [
      'fire', 'smoke', 'burning', 'flames', 'blaze', 'wildfire',
      'on fire', 'engulfed', 'arson',
    ],
  },
  {
    type: 'flood',
    keywords: [
      'flood', 'flooding', 'water level', 'overflow', 'submerged',
      'waterlogging', 'dam breach', 'river rising', 'drowning',
    ],
  },
  {
    type: 'medical',
    keywords: [
      'medical', 'ambulance', 'injured', 'unconscious', 'heart attack',
      'bleeding', 'stroke', 'cardiac', 'breathing', 'collapsed person',
      'overdose', 'seizure', 'emergency patient',
    ],
  },
  {
    type: 'accident',
    keywords: [
      'accident', 'crash', 'collision', 'vehicle accident', 'car crash',
      'road accident', 'hit by', 'pileup', 'rolled over',
    ],
  },
  {
    type: 'industrial',
    keywords: [
      'industrial', 'chemical', 'gas leak', 'explosion', 'factory',
      'hazmat', 'toxic', 'radiation', 'boiler', 'refinery',
    ],
  },
  {
    type: 'structural',
    keywords: [
      'collapse', 'collapsed', 'building fell', 'wall fell', 'structural',
      'bridge collapse', 'roof caved', 'building damage', 'debris',
    ],
  },
];

// ─────────────────────────────────────────────
// Severity keywords — evaluated from critical → low
// The FIRST matching level wins, so critical is checked first.
// ─────────────────────────────────────────────
const SEVERITY_RULES = [
  {
    severity: 'critical',
    keywords: [
      'multiple casualties', 'many dead', 'explosion', 'trapped',
      'people trapped', 'spreading fire', 'building collapsed',
      'mass casualty', 'children trapped', 'cannot escape', 'fatalities',
    ],
  },
  {
    severity: 'high',
    keywords: [
      'serious injury', 'major fire', 'heavy flooding', 'large fire',
      'urgent', 'severe', 'unconscious', 'critical condition',
      'evacuate', 'evacuation',
    ],
  },
  {
    severity: 'medium',
    keywords: [
      'minor accident', 'localized flooding', 'small fire',
      'injured', 'moderate', 'some damage',
    ],
  },
  {
    severity: 'low',
    keywords: [
      'small incident', 'no injury', 'minor', 'contained', 'under control',
      'no casualties',
    ],
  },
];

// ─────────────────────────────────────────────
// Severity → Priority mapping
// ─────────────────────────────────────────────
const PRIORITY_MAP = {
  critical: 'P1',
  high: 'P2',
  medium: 'P3',
  low: 'P4',
};

// ─────────────────────────────────────────────
// Recommended actions per type
// ─────────────────────────────────────────────
const ACTIONS_MAP = {
  fire: [
    'Dispatch fire response team',
    'Dispatch ambulance for potential injuries',
    'Notify police for crowd control',
    'Alert nearby hospital',
  ],
  flood: [
    'Dispatch water rescue team',
    'Alert nearby shelters',
    'Notify local authorities',
    'Advise evacuation if needed',
  ],
  medical: [
    'Dispatch ambulance',
    'Alert nearest hospital',
    'Prepare trauma bay',
  ],
  accident: [
    'Dispatch ambulance',
    'Dispatch police for traffic control',
    'Clear alternate route',
    'Alert nearby hospital',
  ],
  industrial: [
    'Dispatch hazmat team',
    'Evacuate surrounding area',
    'Notify safety authorities',
    'Alert nearby hospital',
  ],
  structural: [
    'Dispatch rescue team',
    'Evacuate adjacent buildings',
    'Notify structural engineers',
    'Alert nearby hospital',
  ],
  other: [
    'Assess situation',
    'Dispatch appropriate team after evaluation',
  ],
};

// ─────────────────────────────────────────────
// Core matcher: given text, return the first category whose
// keywords appear. Returns { match, weight } where weight = matched keywords count.
// ─────────────────────────────────────────────
const detectType = (text) => {
  for (const rule of TYPE_RULES) {
    const matched = rule.keywords.filter((kw) => text.includes(kw));
    if (matched.length > 0) {
      return { type: rule.type, matchedKeywords: matched };
    }
  }
  return { type: 'other', matchedKeywords: [] };
};

const detectSeverity = (text) => {
  for (const rule of SEVERITY_RULES) {
    const matched = rule.keywords.filter((kw) => text.includes(kw));
    if (matched.length > 0) {
      return { severity: rule.severity, matchedKeywords: matched };
    }
  }
  // Default when no severity keyword matches
  return { severity: 'medium', matchedKeywords: [] };
};

// ─────────────────────────────────────────────
// Confidence estimation
// More matched keywords = higher confidence.
// Type match = base 0.5, severity match = base 0.4, capped at 0.85.
// ─────────────────────────────────────────────
const estimateConfidence = (typeMatches, severityMatches, textLength) => {
  if (typeMatches.length === 0) return 0.3;

  const typeScore = Math.min(0.5, 0.25 + typeMatches.length * 0.1);
  const severityScore = Math.min(0.35, 0.1 + severityMatches.length * 0.1);
  const lengthBonus = textLength > 100 ? 0.05 : 0;

  return Math.min(0.85, typeScore + severityScore + lengthBonus);
};

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────
const classifyByRules = (description) => {
  if (!description || typeof description !== 'string') {
    return {
      type: 'other',
      severity: 'medium',
      priority: 'P3',
      confidence: 0.2,
      summary: 'Empty or invalid description provided.',
      recommendedActions: ACTIONS_MAP.other,
      source: 'rules',
      ruleMatches: { type: [], severity: [] },
    };
  }

  const text = description.toLowerCase();

  const { type, matchedKeywords: typeMatches } = detectType(text);
  const { severity, matchedKeywords: severityMatches } = detectSeverity(text);
  const priority = PRIORITY_MAP[severity];
  const confidence = estimateConfidence(typeMatches, severityMatches, text.length);

  // Short human-readable summary — trims to 120 chars
  const summary =
    description.length > 120
      ? `${description.slice(0, 117)}...`
      : description;

  return {
    type,
    severity,
    priority,
    confidence: Math.round(confidence * 100) / 100,
    summary,
    recommendedActions: ACTIONS_MAP[type] || ACTIONS_MAP.other,
    source: 'rules',
    ruleMatches: {
      type: typeMatches,
      severity: severityMatches,
    },
  };
};

module.exports = { classifyByRules };