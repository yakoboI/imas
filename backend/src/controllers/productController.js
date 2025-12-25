const { Op, literal, fn, col } = require('sequelize');
const { Product, Category, Inventory, Warehouse } = require('../models/index');
const AuditService = require('../services/auditService');

class ProductController {
  // Get all products
  static async getAllProducts(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      // Validate tenantId exists (except for SuperAdmin with explicit tenant_id)
      if (!tenantId && !req.user?.isSuperAdmin) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const { page = 1, limit = 50, search, category_id, status } = req.query;

      // Build where clause properly - collect all conditions
      const conditions = [];
      
      // Always add tenant_id filter if present
      if (tenantId) {
        conditions.push({ tenant_id: tenantId });
      }
      
      // Add search conditions
      if (search) {
        conditions.push({
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            { sku: { [Op.iLike]: `%${search}%` } }
          ]
        });
      }
      
      // Add category filter
      if (category_id) {
        conditions.push({ category_id });
      }
      
      // Add status filter
      if (status) {
        conditions.push({ status });
      }
      
      // Build final where object
      const where = conditions.length === 0 
        ? {} 
        : conditions.length === 1 
          ? conditions[0] 
          : { [Op.and]: conditions };

      const offset = (page - 1) * limit;
      
      const { count, rows: products } = await Product.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name'],
            required: false // LEFT JOIN - include products even without category
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'DESC']] // Order by id as fallback - this should always work
      });

      // Get all product IDs
      const productIds = products.map(p => p.id);

      // Get stock sums for all products in one query
      const stockSums = {};
      if (productIds.length > 0) {
        try {
          const stockResults = await Inventory.findAll({
            where: {
              tenant_id: tenantId,
              product_id: { [Op.in]: productIds }
            },
            attributes: [
              'product_id',
              [fn('SUM', col('quantity')), 'total_stock']
            ],
            group: ['product_id'],
            raw: true
          });

          stockResults.forEach(result => {
            const stockValue = result.total_stock ? parseInt(result.total_stock) : 0;
            stockSums[result.product_id] = stockValue;
          });
        } catch (stockError) {
          console.error('[ProductController] getAllProducts - Error fetching stock:', stockError);
        }
      }

      // Add stock_quantity to each product
      const rows = products.map(product => {
        const productData = product.toJSON();
        const stockValue = stockSums[product.id] || 0;
        productData.stock_quantity = stockValue;
        return productData;
      });

      res.json({
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('[ProductController] Error in getAllProducts:', error);
      console.error('[ProductController] Error stack:', error.stack);
      next(error);
    }
  }

  // Get product by ID
  static async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const product = await Product.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json({ product });
    } catch (error) {
      next(error);
    }
  }

  // Create product
  static async createProduct(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { name, sku, description, price, category_id, cost, image_url, barcode, unit, tax_rate, status, stock_quantity, warehouse_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      // Generate SKU if not provided
      let productSku = sku;
      if (!productSku || productSku.trim() === '') {
        // Generate unique SKU based on product name and timestamp
        const timestamp = Date.now().toString().slice(-8);
        const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'PRD';
        productSku = `${namePrefix}-${timestamp}`;
      }

      // Ensure SKU is unique for this tenant
      let existingProduct = await Product.findOne({
        where: { sku: productSku, tenant_id: tenantId }
      });

      // If SKU exists, append random number
      if (existingProduct) {
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        productSku = `${productSku}-${random}`;
        // Check again
        existingProduct = await Product.findOne({
          where: { sku: productSku, tenant_id: tenantId }
        });
        if (existingProduct) {
          return res.status(409).json({ error: 'Product with this SKU already exists. Please provide a different SKU.' });
        }
      }

      const product = await Product.create({
        tenant_id: tenantId,
        name,
        sku: productSku,
        description: description || null,
        price: price || 0,
        cost: cost || 0,
        category_id: category_id || null,
        image_url: image_url || null,
        barcode: barcode || null,
        unit: unit || 'piece',
        tax_rate: tax_rate || 0,
        status: status || 'active'
      });

      // Create inventory record if stock_quantity and warehouse_id provided
      // Check if stock_quantity is a valid number > 0
      const stockQty = stock_quantity ? parseInt(stock_quantity) : 0;
      // warehouse_id is UUID (string), don't parse as integer
      const warehouseId = warehouse_id && warehouse_id.trim() !== '' ? warehouse_id.trim() : null;
      console.log('[ProductController] createProduct - Parsed stockQty:', stockQty, 'warehouseId (UUID):', warehouseId);
      
      if (stockQty > 0 && warehouseId) {
        // Validate warehouse belongs to tenant
        const warehouse = await Warehouse.findOne({
          where: { id: warehouseId, tenant_id: tenantId }
        });

        if (!warehouse) {
          console.error('[ProductController] createProduct - Warehouse not found. ID:', warehouseId, 'Tenant:', tenantId);
        } else {

          // Create or update inventory record
          try {
            const [inventory, created] = await Inventory.findOrCreate({
              where: {
                tenant_id: tenantId,
                product_id: product.id,
                warehouse_id: warehouseId
              },
              defaults: {
                tenant_id: tenantId,
                product_id: product.id,
                warehouse_id: warehouseId,
                quantity: stockQty,
                last_updated: new Date()
              }
            });

            if (!created) {
              // Update existing inventory
              inventory.quantity = stockQty;
              inventory.last_updated = new Date();
              await inventory.save();
            }

            // Log stock movement
            const { StockMovement } = require('../models/index');
            await StockMovement.create({
              tenant_id: tenantId,
              product_id: product.id,
              warehouse_id: warehouseId,
              type: 'in',
              quantity: stockQty,
              reference_type: 'PRODUCT_CREATION',
              notes: `Initial stock on product creation`,
              created_by: req.user.id
            }).catch(err => console.error('[ProductController] Error creating stock movement:', err));
            
            console.log('[ProductController] createProduct - Stock movement logged');
          } catch (inventoryError) {
            console.error('[ProductController] createProduct - Error creating inventory:', inventoryError);
            console.error('[ProductController] createProduct - Error stack:', inventoryError.stack);
            // Don't fail the product creation, just log the error
          }
        }
      } else {
        console.log('[ProductController] createProduct - Skipping inventory creation. stockQty:', stockQty, 'warehouseId:', warehouseId);
      }

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_PRODUCT',
        entity_type: 'Product',
        entity_id: product.id,
        new_values: product.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Product "${name}" created${stockQty > 0 ? ` with initial stock of ${stockQty}` : ''}`
      });

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  // Update product
  static async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const product = await Product.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const oldValues = { ...product.toJSON() };

      const allowedFields = ['name', 'sku', 'description', 'price', 'cost', 'category_id', 'image_url', 'barcode', 'unit', 'tax_rate', 'status'];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await product.update(updateData);

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_PRODUCT',
        entity_type: 'Product',
        entity_id: id,
        old_values: oldValues,
        new_values: updateData,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Product "${product.name}" updated`
      });

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete product
  static async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const product = await Product.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await product.destroy();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_PRODUCT',
        entity_type: 'Product',
        entity_id: id,
        old_values: product.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Product "${product.name}" deleted`
      });

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;

