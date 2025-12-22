const AuditLog = require('../models/AuditLog');
const SystemLog = require('../models/SystemLog');

// Automatically log all actions to audit trail
const auditLogger = async (req, res, next) => {
  // Skip logging for GET requests (except sensitive ones)
  if (req.method === 'GET' && !req.path.includes('/audit') && !req.path.includes('/profile')) {
    return next();
  }

  // Store original json method
  const originalJson = res.json;

  // Override json method to capture response
  res.json = function (data) {
    // Log after response is sent
    setImmediate(async () => {
      try {
        const action = `${req.method}_${req.path}`.toUpperCase();
        const entityType = extractEntityType(req.path);
        const entityId = req.params.id || req.body.id || null;

        // For SuperAdmin actions, log to SystemLog
        if (req.user && req.user.isSuperAdmin) {
          await SystemLog.create({
            superadmin_id: req.user.id,
            action: action,
            target_tenant_id: req.tenantId || null,
            description: `${req.user.email} performed ${action} on ${entityType}`,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'],
            timestamp: new Date()
          });
        } else {
          // Regular user actions log to AuditLog
          await AuditLog.create({
            tenant_id: req.tenantId || null,
            user_id: req.user?.id || null,
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            old_values: req.body._old || null,
            new_values: req.method !== 'DELETE' ? req.body : null,
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.headers['user-agent'],
            description: generateDescription(req, action, entityType),
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Audit logging error:', error);
        // Don't fail the request if audit logging fails
      }
    });

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};

// Extract entity type from path
function extractEntityType(path) {
  const parts = path.split('/').filter(p => p && !p.startsWith(':'));
  if (parts.length > 0) {
    const entity = parts[parts.length - 1];
    return entity.charAt(0).toUpperCase() + entity.slice(1).replace(/s$/, '');
  }
  return 'Unknown';
}

// Generate human-readable description
function generateDescription(req, action, entityType) {
  const user = req.user?.email || 'Unknown';
  const method = req.method;

  if (method === 'POST') {
    return `${user} created a new ${entityType}`;
  } else if (method === 'PUT' || method === 'PATCH') {
    return `${user} updated ${entityType} ${req.params.id || ''}`;
  } else if (method === 'DELETE') {
    return `${user} deleted ${entityType} ${req.params.id || ''}`;
  }

  return `${user} performed ${action} on ${entityType}`;
}

module.exports = auditLogger;

