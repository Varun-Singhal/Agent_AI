/**
 * Smart Tab Manager - Options Page Script
 * Handles user settings and configuration
 */

class OptionsManager {
  constructor() {
    this.settings = {
      inactivityTimeout: 15,
      autoCloseDuplicates: true,
      whitelist: [],
      enabled: true,
      showNotifications: true
    };
    
    this.init();
  }

  /**
   * Initialize the options page
   */
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.populateWhitelist();
    this.updateStats();
    
    console.log('Options page initialized');
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'inactivityTimeout',
        'autoCloseDuplicates',
        'whitelist',
        'enabled',
        'showNotifications'
      ]);
      
      this.settings = { ...this.settings, ...result };
      
      // Populate form fields
      document.getElementById('enabled').checked = this.settings.enabled;
      document.getElementById('autoCloseDuplicates').checked = this.settings.autoCloseDuplicates;
      document.getElementById('showNotifications').checked = this.settings.showNotifications;
      document.getElementById('inactivityTimeout').value = this.settings.inactivityTimeout;
      
    } catch (error) {
      console.error('Error loading settings:', error);
      this.showStatus('Error loading settings', 'error');
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      // Get current form values
      this.settings.enabled = document.getElementById('enabled').checked;
      this.settings.autoCloseDuplicates = document.getElementById('autoCloseDuplicates').checked;
      this.settings.showNotifications = document.getElementById('showNotifications').checked;
      this.settings.inactivityTimeout = parseInt(document.getElementById('inactivityTimeout').value);
      
      // Validate settings
      if (this.settings.inactivityTimeout < 1 || this.settings.inactivityTimeout > 120) {
        this.showStatus('Inactivity timeout must be between 1 and 120 minutes', 'error');
        return;
      }
      
      // Save to storage
      await chrome.storage.sync.set(this.settings);
      
      this.showStatus('Settings saved successfully!', 'success');
      
      // Update stats after saving
      setTimeout(() => this.updateStats(), 500);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showStatus('Error saving settings', 'error');
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Save button
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Auto-save on input changes
    document.getElementById('inactivityTimeout').addEventListener('input', () => {
      this.autoSave();
    });

    document.getElementById('enabled').addEventListener('change', () => {
      this.autoSave();
    });

    document.getElementById('autoCloseDuplicates').addEventListener('change', () => {
      this.autoSave();
    });

    document.getElementById('showNotifications').addEventListener('change', () => {
      this.autoSave();
    });

    // Whitelist management
    document.getElementById('addWhitelist').addEventListener('click', () => {
      this.addToWhitelist();
    });

    document.getElementById('whitelistInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToWhitelist();
      }
    });

    // Restore buttons
    document.getElementById('restoreLast5').addEventListener('click', () => {
      this.restoreTabs(5);
    });

    document.getElementById('restoreLast10').addEventListener('click', () => {
      this.restoreTabs(10);
    });
  }

  /**
   * Auto-save settings with debounce
   */
  autoSave() {
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.saveSettings();
    }, 1000);
  }

  /**
   * Add domain to whitelist
   */
  addToWhitelist() {
    const input = document.getElementById('whitelistInput');
    const domain = input.value.trim().toLowerCase();
    
    if (!domain) {
      this.showStatus('Please enter a domain', 'error');
      return;
    }
    
    // Basic domain validation
    if (!this.isValidDomain(domain)) {
      this.showStatus('Please enter a valid domain (e.g., gmail.com)', 'error');
      return;
    }
    
    if (this.settings.whitelist.includes(domain)) {
      this.showStatus('Domain already in whitelist', 'error');
      return;
    }
    
    this.settings.whitelist.push(domain);
    this.populateWhitelist();
    input.value = '';
    this.autoSave();
    this.showStatus(`Added ${domain} to whitelist`, 'success');
  }

  /**
   * Remove domain from whitelist
   */
  removeFromWhitelist(domain) {
    this.settings.whitelist = this.settings.whitelist.filter(d => d !== domain);
    this.populateWhitelist();
    this.autoSave();
    this.showStatus(`Removed ${domain} from whitelist`, 'success');
  }

  /**
   * Populate whitelist display
   */
  populateWhitelist() {
    const container = document.getElementById('whitelistList');
    container.innerHTML = '';
    
    if (this.settings.whitelist.length === 0) {
      container.innerHTML = '<p class="empty-state">No domains in whitelist</p>';
      return;
    }
    
    this.settings.whitelist.forEach(domain => {
      const item = document.createElement('div');
      item.className = 'whitelist-item';
      item.innerHTML = `
        <span class="domain-name">${domain}</span>
        <button class="btn-remove" data-domain="${domain}">×</button>
      `;
      
      item.querySelector('.btn-remove').addEventListener('click', () => {
        this.removeFromWhitelist(domain);
      });
      
      container.appendChild(item);
    });
  }

  /**
   * Validate domain format
   */
  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    return domainRegex.test(domain);
  }

  /**
   * Update statistics display
   */
  async updateStats() {
    try {
      // Get tabs closed today
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['tabsClosedToday', 'lastResetDate', 'totalTabsClosed']);
      
      const tabsClosedToday = result.lastResetDate === today ? (result.tabsClosedToday || 0) : 0;
      const totalTabsClosed = result.totalTabsClosed || 0;
      
      document.getElementById('tabsClosedToday').textContent = tabsClosedToday;
      document.getElementById('tabsClosedTotal').textContent = totalTabsClosed;
      
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Restore closed tabs
   */
  async restoreTabs(count) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'restoreLastTabs',
        count: count
      });
      
      if (response.restored > 0) {
        this.showStatus(`Restored ${response.restored} tabs`, 'success');
      } else {
        this.showStatus('No tabs available to restore', 'error');
      }
      
    } catch (error) {
      console.error('Error restoring tabs:', error);
      this.showStatus('Error restoring tabs', 'error');
    }
  }

  /**
   * Show status message
   */
  showStatus(message, type = 'info') {
    const statusEl = document.getElementById('saveStatus');
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    
    // Clear status after 3 seconds
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'save-status';
    }, 3000);
  }
}

// Initialize options manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});

