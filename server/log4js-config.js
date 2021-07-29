const levels = ['DEBUG', 'INFO', 'WRAN', 'ERROR'];
const debugMode = process.env.log || 'INFO';
const logLevel = levels.indexOf(debugMode) !== -1 ? debugMode : 'INFO';

module.exports = {
  'appenders': {
    'console': {
      'type': 'console'
    },
    'access': {
      'type': 'dateFile',
      'filename': 'logs/access.log',
      'pattern': '-yyyy-MM-dd',
      'category': 'http'
    },
    'app': {
      'type': 'file',
      'filename': 'logs/app.log',
      'level': 'DEBUG',
      'maxLogSize': 10485760,
      'numBackups': 3
    },
    'errorFile': {
      'type': 'file',
      'filename': 'logs/errors.log'
    },
    'errors': {
      'type': 'logLevelFilter',
      'level': 'ERROR',
      'appender': 'errorFile'
    },
  },
  'categories': {
    'default': { 'appenders': ['app', 'console', 'errors'], 'level': logLevel },
    'http': { 'appenders': ['console', 'access'], 'level': logLevel },
  },
  'pm2': true,
};
