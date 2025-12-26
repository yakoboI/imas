const logger = require('../utils/logger');
const performanceMetrics = require('../services/performanceMetrics');

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log to winston
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      user: req.user?.email || 'anonymous'
    });

    // Record performance metrics (skip health checks and static files)
    if (!req.path.includes('/health') && !req.path.includes('/uploads')) {
      performanceMetrics.recordResponseTime(
        req.method,
        req.path,
        res.statusCode,
        duration
      );
    }
  });

  next();
};

module.exports = requestLogger;

