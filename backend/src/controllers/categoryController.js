const { Op } = require('sequelize');
const { Category, Product } = require('../models/index');
const AuditService = require('../services/auditService');

class CategoryController {
  // Get all categories
  static async getAllCategories(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }

      const { page = 1, limit = 100, search } = req.query;
      const where = { tenant_id: tenantId };
      
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;

      const { count, rows } = await Category.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      res.json({
        categories: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get category by ID
  static async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const category = await Category.findOne({
        where: { id, tenant_id: tenantId },
        include: [
          {
            model: Category,
            as: 'parent',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: Category,
            as: 'children',
            attributes: ['id', 'name'],
            required: false
          }
        ]
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json({ category });
    } catch (error) {
      next(error);
    }
  }

  // Create category
  static async createCategory(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' });
      }
      
      const { name, description, parent_id } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      // Check if category with same name exists for this tenant
      const existingCategory = await Category.findOne({
        where: { name, tenant_id: tenantId }
      });

      if (existingCategory) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }

      // Validate parent_id if provided
      if (parent_id) {
        const parent = await Category.findOne({
          where: { id: parent_id, tenant_id: tenantId }
        });
        if (!parent) {
          return res.status(404).json({ error: 'Parent category not found' });
        }
      }

      const category = await Category.create({
        tenant_id: tenantId,
        name,
        description: description || null,
        parent_id: parent_id || null
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'CREATE_CATEGORY',
        entity_type: 'Category',
        entity_id: category.id,
        new_values: category.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Category "${name}" created`
      });

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  // Update category
  static async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      
      const category = await Category.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const { name, description, parent_id } = req.body;
      const oldValues = category.toJSON();

      // Check if name is being changed and if new name already exists
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
          where: { name, tenant_id: tenantId },
          id: { [Op.ne]: id }
        });
        if (existingCategory) {
          return res.status(409).json({ error: 'Category with this name already exists' });
        }
      }

      // Validate parent_id if provided (cannot be itself)
      if (parent_id) {
        if (parent_id === id) {
          return res.status(400).json({ error: 'Category cannot be its own parent' });
        }
        const parent = await Category.findOne({
          where: { id: parent_id, tenant_id: tenantId }
        });
        if (!parent) {
          return res.status(404).json({ error: 'Parent category not found' });
        }
      }

      await category.update({
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        parent_id: parent_id !== undefined ? parent_id : category.parent_id
      });

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'UPDATE_CATEGORY',
        entity_type: 'Category',
        entity_id: category.id,
        old_values: oldValues,
        new_values: category.toJSON(),
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Category "${category.name}" updated`
      });

      res.json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete category
  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      
      const category = await Category.findOne({
        where: { id, tenant_id: tenantId }
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      // Check if category has children
      const childrenCount = await Category.count({
        where: { parent_id: id, tenant_id: tenantId }
      });

      if (childrenCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' 
        });
      }

      // Check if category has products
      const productsCount = await Product.count({
        where: { category_id: id, tenant_id: tenantId }
      });

      if (productsCount > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete category with products. Please reassign products to another category first.' 
        });
      }

      const oldValues = category.toJSON();
      await category.destroy();

      // Log audit trail
      await AuditService.logAction({
        tenant_id: tenantId,
        user_id: req.user.id,
        action: 'DELETE_CATEGORY',
        entity_type: 'Category',
        entity_id: id,
        old_values: oldValues,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        description: `Category "${oldValues.name}" deleted`
      });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = CategoryController;

