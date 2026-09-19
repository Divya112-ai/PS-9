const Counter = require('../models/Counter');

/**
 * Generate the next incident public ID: INC-10001, INC-10002, ...
 */
const generateIncidentId = async () => {
  const seq = await Counter.getNext('incident');
  return `INC-${String(10000 + seq).padStart(5, '0')}`;
};

/**
 * Generate the next source report public ID: REP-10001, REP-10002, ...
 */
const generateReportId = async () => {
  const seq = await Counter.getNext('report');
  return `REP-${String(10000 + seq).padStart(5, '0')}`;
};

/**
 * Generate resource public IDs from a prefix: FT-01, AMB-02, PU-03
 * Used mainly during seeding.
 */
const generateResourceId = (prefix, index) => {
  return `${prefix}-${String(index).padStart(2, '0')}`;
};

module.exports = {
  generateIncidentId,
  generateReportId,
  generateResourceId,
};