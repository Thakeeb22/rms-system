// config/attendanceConfig.js

module.exports = {
  // Default late cutoff time (24-hour format).
  // In the future, this can be fetched from a School Settings database collection.
  DEFAULT_LATE_CUTOFF_HOUR: 8, 
  DEFAULT_LATE_CUTOFF_MINUTE: 0, 
  
  // Helper function to get the cutoff Date object for a specific day
  getLateCutoffDate: function(baseDate = new Date()) {
    const cutoff = new Date(baseDate);
    cutoff.setHours(this.DEFAULT_LATE_CUTOFF_HOUR, this.DEFAULT_LATE_CUTOFF_MINUTE, 0, 0);
    return cutoff;
  }
};