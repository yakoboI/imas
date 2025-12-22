// Middleware to automatically inject tenant_id into requests
// This ensures all queries are scoped to the current tenant

const tenantResolver = (req, res, next) => {
  // SuperAdmin can bypass tenant filtering
  if (req.user && req.user.isSuperAdmin) {
    // SuperAdmin can optionally specify tenant_id in query/body for specific tenant access
    if (req.query.tenant_id) {
      req.tenantId = req.query.tenant_id;
    } else if (req.body.tenant_id) {
      req.tenantId = req.body.tenant_id;
    }
    // If no tenant_id specified, SuperAdmin sees all tenants
    return next();
  }

  // Regular users must have tenant_id from their user record
  if (req.user && req.user.tenantId) {
    req.tenantId = req.user.tenantId;
  }

  next();
};

module.exports = tenantResolver;

