const Tenant = require('../models/Tenant');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const TraApiService = require('./traApiService');
const { Op, fn, col } = require('sequelize');

/**
 * Z-Report Service
 * Generates and submits daily Z-Reports (Daily Sales Summaries) to TRA EFDMS
 */
class ZReportService {
  /**
   * Generate Z-Report data for a tenant for a specific date
   * @param {string} tenantId - Tenant ID
   * @param {Date} date - Date for the report (defaults to yesterday)
   * @returns {Promise<Object>} - Z-Report data
   */
  static async generateZReportData(tenantId, date = null) {
    const targetDate = date || new Date();
    targetDate.setDate(targetDate.getDate() - 1); // Default to yesterday
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all receipts for the day (only active, non-voided receipts)
    const receipts = await Receipt.findAll({
      where: {
        tenant_id: tenantId,
        issue_date: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        status: 'active' // Only include active receipts
      },
      include: [
        {
          model: ReceiptItem,
          as: 'items',
          required: false
        }
      ],
      order: [['issue_date', 'ASC']]
    });

    // Calculate totals
    const totalSales = receipts.reduce((sum, receipt) => {
      return sum + parseFloat(receipt.total_amount || 0);
    }, 0);

    const totalTax = receipts.reduce((sum, receipt) => {
      return sum + parseFloat(receipt.tax_amount || 0);
    }, 0);

    const totalInvoices = receipts.length;

    // Prepare detailed report data
    const reportData = receipts.map(receipt => ({
      receiptNumber: receipt.receipt_number,
      traReceiptNumber: receipt.tra_receipt_number,
      date: receipt.issue_date,
      total: parseFloat(receipt.total_amount || 0),
      tax: parseFloat(receipt.tax_amount || 0),
      subtotal: parseFloat(receipt.total_amount || 0) - parseFloat(receipt.tax_amount || 0),
      paymentMethod: receipt.payment_method || 'cash',
      customerName: receipt.customer?.name || 'Walk-in Customer'
    }));

    return {
      date: targetDate.toISOString().split('T')[0],
      totalSales,
      totalTax,
      totalInvoices,
      reportData,
      receipts: receipts.map(r => r.id) // Store receipt IDs for reference
    };
  }

  /**
   * Submit Z-Report to TRA for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Date} date - Date for the report (defaults to yesterday)
   * @returns {Promise<Object>} - Submission result
   */
  static async submitZReport(tenantId, date = null) {
    try {
      const tenant = await Tenant.findByPk(tenantId);

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Check if tenant has TRA integration enabled and verified
      if (!tenant.tra_verified || !tenant.tenant_tin || !tenant.vfd_serial_num) {
        return {
          success: false,
          message: 'TRA integration not configured or not verified for this tenant',
          skipped: true
        };
      }

      // Check if Z-report was already submitted for this date
      const targetDate = date || new Date();
      targetDate.setDate(targetDate.getDate() - 1); // Default to yesterday
      const dateStr = targetDate.toISOString().split('T')[0];

      if (tenant.last_zreport_date) {
        const lastZReportDate = new Date(tenant.last_zreport_date);
        const lastZReportDateStr = lastZReportDate.toISOString().split('T')[0];
        
        if (lastZReportDateStr === dateStr) {
          return {
            success: false,
            message: `Z-Report already submitted for ${dateStr}`,
            skipped: true
          };
        }
      }

      // Generate Z-Report data
      const zReportData = await this.generateZReportData(tenantId, date);

      // Submit to TRA API
      const traResponse = await TraApiService.submitZReport(tenant, zReportData);

      if (traResponse.success) {
        // Update tenant with Z-report submission info
        await tenant.update({
          current_global_counter: traResponse.globalCounter,
          last_zreport_date: new Date(targetDate)
        });

        console.log(`Z-Report submitted successfully for tenant ${tenantId} on ${dateStr}. Global Counter: ${traResponse.globalCounter}`);

        return {
          success: true,
          message: 'Z-Report submitted successfully',
          date: dateStr,
          globalCounter: traResponse.globalCounter,
          data: traResponse.data
        };
      } else {
        throw new Error(traResponse.message || 'Failed to submit Z-Report to TRA');
      }
    } catch (error) {
      console.error(`Error submitting Z-Report for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Submit Z-Reports for all tenants with TRA integration enabled
   * Used by the scheduler to run daily Z-reports
   */
  static async submitZReportsForAllTenants(date = null) {
    try {
      // Find all tenants with TRA integration verified
      const tenants = await Tenant.findAll({
        where: {
          tra_verified: true,
          status: 'active'
        }
      });

      const results = [];

      for (const tenant of tenants) {
        try {
          const result = await this.submitZReport(tenant.id, date);
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            ...result
          });
        } catch (error) {
          results.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            success: false,
            error: error.message
          });
        }
      }

      return {
        totalTenants: tenants.length,
        results
      };
    } catch (error) {
      console.error('Error submitting Z-Reports for all tenants:', error);
      throw error;
    }
  }
}

module.exports = ZReportService;

