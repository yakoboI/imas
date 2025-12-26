/**
 * Performance Metrics Service
 * Tracks response times and calculates average performance metrics
 */

class PerformanceMetrics {
  constructor() {
    // Store response times in memory (last 1000 requests)
    this.responseTimes = [];
    this.maxSamples = 1000;
    this.requestCounts = {
      total: 0,
      byMethod: {},
      byPath: {},
      byStatus: {}
    };
  }

  /**
   * Record a response time
   */
  recordResponseTime(method, path, status, duration) {
    // Add to response times array
    this.responseTimes.push({
      method,
      path,
      status,
      duration,
      timestamp: Date.now()
    });

    // Keep only last maxSamples
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }

    // Update counters
    this.requestCounts.total++;
    this.requestCounts.byMethod[method] = (this.requestCounts.byMethod[method] || 0) + 1;
    this.requestCounts.byPath[path] = (this.requestCounts.byPath[path] || 0) + 1;
    this.requestCounts.byStatus[status] = (this.requestCounts.byStatus[status] || 0) + 1;
  }

  /**
   * Get average response time
   */
  getAverageResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((acc, req) => acc + req.duration, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  /**
   * Get median response time
   */
  getMedianResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a.duration - b.duration);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1].duration + sorted[mid].duration) / 2)
      : sorted[mid].duration;
  }

  /**
   * Get p95 response time (95th percentile)
   */
  getP95ResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    const sorted = [...this.responseTimes].sort((a, b) => a.duration - b.duration);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index]?.duration || 0;
  }

  /**
   * Get minimum response time
   */
  getMinResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    return Math.min(...this.responseTimes.map(req => req.duration));
  }

  /**
   * Get maximum response time
   */
  getMaxResponseTime() {
    if (this.responseTimes.length === 0) return 0;
    return Math.max(...this.responseTimes.map(req => req.duration));
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recentRequests = this.responseTimes.slice(-100); // Last 100 requests
    const recentAvg = recentRequests.length > 0
      ? Math.round(recentRequests.reduce((acc, req) => acc + req.duration, 0) / recentRequests.length)
      : 0;

    return {
      totalRequests: this.requestCounts.total,
      averageResponseTime: this.getAverageResponseTime(),
      medianResponseTime: this.getMedianResponseTime(),
      p95ResponseTime: this.getP95ResponseTime(),
      minResponseTime: this.getMinResponseTime(),
      maxResponseTime: this.getMaxResponseTime(),
      recentAverageResponseTime: recentAvg,
      requestCounts: {
        byMethod: { ...this.requestCounts.byMethod },
        byStatus: { ...this.requestCounts.byStatus }
      },
      sampleSize: this.responseTimes.length
    };
  }

  /**
   * Reset metrics (for testing or periodic reset)
   */
  reset() {
    this.responseTimes = [];
    this.requestCounts = {
      total: 0,
      byMethod: {},
      byPath: {},
      byStatus: {}
    };
  }
}

// Export singleton instance
module.exports = new PerformanceMetrics();

