module.exports = {
  User: require('./User'),
  Incident: require('./Incident'),
  SourceReport: require('./SourceReport'),
  Resource: require('./Resource'),
  Alert: require('./Alert'),
  AnalyticsEvent: require('./AnalyticsEvent'),
  Counter: require('./Counter'),
};
const { Incident, Resource } = require('../models');