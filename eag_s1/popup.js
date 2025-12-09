/**
 * Smart Tab Manager - Popup Script
 * Handles the popup interface and quick controls
 */

class PopupManager {
  constructor() {
    this.stats = {
      tabsClosedToday: 0,
      enabled: false,
      currentTabs: 0
    };
    
    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    await this.loadStats();
    this.setupEventListeners();
    this.updateDisplay();
    this.updateLastChecked();
    
    console.log('Popup initialized');
  }

  /**
   * Load statistics and settings
   */
  async loadStats() {
    try {
      // Get stats from background script
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      
      if (response) {
        this.stats.tabsClosedToday = response.tabsClosedToday || 0;
        this.stats.enabled = response.enabled || false;
      }
      
      // Get current tab count
      const tabs = await chrome.tabs.query({});
      this.stats.currentTabs = tabs.length;
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Toggle enable/disable
    document.getElementById('enabledToggle').addEventListener('change', (e) => {
      this.toggleEnabled(e.target.checked);
    });

    // Close duplicates button
    document.getElementById('closeDuplicates').addEventListener('click', () => {
      this.closeDuplicates();
    });

    // Restore tabs button
    document.getElementById('restoreTabs').addEventListener('click', () => {
      this.restoreTabs();
    });

    // Open settings button
    document.getElementById('openSettings').addEventListener('click', () => {
      this.openSettings();
    });
  }

  /**
   * Update the display with current data
   */
  updateDisplay() {
    // Update toggle state
    document.getElementById('enabledToggle').checked = this.stats.enabled;
    
    // Update statistics
    document.getElementById('tabsClosedToday').textContent = this.stats.tabsClosedToday;
    document.getElementById('currentTabs').textContent = this.stats.currentTabs;
    
    // Update status indicator
    this.updateStatusIndicator();
  }

  /**
   * Update status indicator
   */
  updateStatusIndicator() {
    const indicator = document.getElementById('statusIndicator');
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('.status-text');
    
    if (this.stats.enabled) {
      dot.className = 'status-dot active';
      text.textContent = 'Active';
    } else {
      dot.className = 'status-dot inactive';
      text.textContent = 'Inactive';
    }
  }

  /**
   * Toggle extension enabled state
   */
  async toggleEnabled(enabled) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'toggleEnabled',
        enabled: enabled
      });
      
      if (response.success) {
        this.stats.enabled = enabled;
        this.updateStatusIndicator();
        this.showNotification(enabled ? 'Extension enabled' : 'Extension disabled');
      } else {
        // Revert toggle if failed
        document.getElementById('enabledToggle').checked = !enabled;
        this.showNotification('Failed to update settings', 'error');
      }
    } catch (error) {
      console.error('Error toggling enabled state:', error);
      document.getElementById('enabledToggle').checked = !enabled;
      this.showNotification('Error updating settings', 'error');
    }
  }

  /**
   * Close duplicate tabs
   */
  async closeDuplicates() {
    try {
      // This will trigger the background script to check for duplicates
      const response = await chrome.runtime.sendMessage({
        action: 'closeDuplicates'
      });
      
      this.showNotification('Checking for duplicate tabs...');
      
      // Refresh stats after a short delay
      setTimeout(() => {
        this.loadStats().then(() => this.updateDisplay());
      }, 1000);
      
    } catch (error) {
      console.error('Error closing duplicates:', error);
      this.showNotification('Error closing duplicates', 'error');
    }
  }

  /**
   * Restore last 5 tabs
   */
  async restoreTabs() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'restoreLastTabs',
        count: 5
      });
      
      if (response.restored > 0) {
        this.showNotification(`Restored ${response.restored} tabs`);
        // Refresh tab count
        await this.loadStats();
        this.updateDisplay();
      } else {
        this.showNotification('No tabs available to restore', 'error');
      }
      
    } catch (error) {
      console.error('Error restoring tabs:', error);
      this.showNotification('Error restoring tabs', 'error');
    }
  }

  /**
   * Open settings page
   */
  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Update last checked time
   */
  updateLastChecked() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').textContent = `Last checked: ${timeString}`;
  }

  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Create temporary notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to popup
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

