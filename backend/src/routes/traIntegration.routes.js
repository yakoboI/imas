const express = require('express');
const router = express.Router();
const TraIntegrationController = require('../controllers/traIntegrationController');
const { authenticate, authorize } = require('../middleware/auth');
const tenantResolver = require('../middleware/tenantResolver');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for PFX certificate file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Create temporary directory for uploads
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with tenant ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `tra-cert-${req.tenantId}-${uniqueSuffix}.pfx`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only .pfx and .p12 files (certificate files)
  const allowedExtensions = ['.pfx', '.p12'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only .pfx and .p12 certificate files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for certificate files
  }
});

// Get TRA integration configuration (Admin only)
router.get(
  '/',
  authenticate,
  tenantResolver,
  authorize('admin'),
  TraIntegrationController.getTraConfiguration
);

// Configure TRA integration (Admin only) - accepts file upload
router.post(
  '/configure',
  authenticate,
  tenantResolver,
  authorize('admin'),
  upload.single('certificate'), // Handle single file upload with field name 'certificate'
  TraIntegrationController.configureTraIntegration
);

// Verify TRA credentials (Admin only)
router.post(
  '/verify',
  authenticate,
  tenantResolver,
  authorize('admin'),
  TraIntegrationController.verifyCredentials
);

// Remove TRA integration (Admin only)
router.delete(
  '/',
  authenticate,
  tenantResolver,
  authorize('admin'),
  TraIntegrationController.removeTraIntegration
);

module.exports = router;

