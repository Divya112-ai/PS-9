const logger = {
  info: (msg, data) => {
    console.log(`[INFO] ${new Date().toISOString()} — ${msg}`, data ?? '');
  },
  warn: (msg, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} — ${msg}`, data ?? '');
  },
  error: (msg, err) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} — ${msg}`,
      err?.stack || err || ''
    );
  },
  debug: (msg, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${msg}`, data ?? '');
    }
  },
};

module.exports = logger;