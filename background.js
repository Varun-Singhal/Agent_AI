// Smart Tab Manager - Background Service Worker (Manifest V3)
// Responsibilities:
// - Track tab activity and close inactive tabs after a configured timeout
// - Detect and close duplicate tabs (same URL or same hostname when enabled)
// - Respect pinned tabs and user-configured whitelist
// - Bookmark tabs that are auto-closed due to inactivity
// - Maintain daily counter of auto-closed tabs
// - Provide notifications when tabs are auto-closed

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  inactivityMinutes: 1440,
  whitelist: [
    // Examples: 'mail.google.com', 'www.youtube.com', 'docs.google.com'
  ],
  closeDuplicates: true,
  notifyOnClose: true,
  bookmarkOnInactivityClose: true,
  maxRestoreStack: 10
};

// In-memory activity map: tabId -> lastActiveEpochMs
const tabLastActiveMs = new Map();

// Simple restore stack for last N closed tabs (only those closed by this extension)
// Each entry: { url, title, closedAt, reason }
let restoreStack = [];

// Utility: get settings from sync storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => resolve(items));
  });
}

// Utility: set settings to sync storage
async function setSettings(partial) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(partial, () => resolve());
  });
}

// Utility: get and increment today's counter
async function incrementClosedToday(by = 1) {
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `closedCount:${todayKey}`;
  const data = await new Promise((resolve) => {
    chrome.storage.local.get([key], (items) => resolve(items));
  });
  const current = data[key] || 0;
  await new Promise((resolve) => {
    chrome.storage.local.set({ [key]: current + by }, () => resolve());
  });
}

// Utility: get today's closed count
async function getClosedToday() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const key = `closedCount:${todayKey}`;
  const data = await new Promise((resolve) => {
    chrome.storage.local.get([key], (items) => resolve(items));
  });
  return data[key] || 0;
}

// Mark activity for a tab
function markActive(tabId) {
  tabLastActiveMs.set(tabId, Date.now());
}

// Remove tracking for a tab
function forgetTab(tabId) {
  tabLastActiveMs.delete(tabId);
}

// Determine if URL matches whitelist
function isWhitelisted(urlString, whitelist) {
  try {
    const url = new URL(urlString);
    return whitelist.some((host) => host && url.hostname.endsWith(host));
  } catch (e) {
    return false;
  }
}

// Create a bookmark for a tab if enabled
async function maybeBookmarkTabOnClose(tab, settings) {
  if (!settings.bookmarkOnInactivityClose) return;
  try {
    await chrome.bookmarks.create({ title: tab.title || tab.url, url: tab.url });
  } catch (e) {
    // Best-effort; ignore bookmark errors
  }
}

// Notify user
async function notifyClosed(tab, reason) {
  const settings = await getSettings();
  if (!settings.notifyOnClose) return;
  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Tab auto-closed',
      message: `${reason}: ${tab.title || tab.url}`
    });
  } catch (e) {
    // Ignore notification errors
  }
}

// Attempt to close a tab for inactivity
async function closeForInactivity(tab) {
  const settings = await getSettings();
  if (!settings.enabled) return;
  if (tab.pinned) return;
  if (isWhitelisted(tab.url, settings.whitelist)) return;

  // Bookmark before closing if enabled
  await maybeBookmarkTabOnClose(tab, settings);

  // Push to restore stack
  restoreStack.unshift({ url: tab.url, title: tab.title, closedAt: Date.now(), reason: 'Inactive' });
  if (restoreStack.length > settings.maxRestoreStack) restoreStack.pop();

  try {
    await chrome.tabs.remove(tab.id);
    await incrementClosedToday(1);
    await notifyClosed(tab, 'Closed unused tab');
  } catch (e) {
    // Ignore if cannot close
  }
}

// Detect and close duplicate tabs
async function closeDuplicateTabs() {
  const settings = await getSettings();
  if (!settings.enabled || !settings.closeDuplicates) return;

  const tabs = await chrome.tabs.query({});
  const seenByUrl = new Map();

  for (const tab of tabs) {
    if (!tab.url) continue;
    if (tab.pinned) continue;
    if (isWhitelisted(tab.url, settings.whitelist)) continue;

    const key = tab.url; // strict by URL. Could add hostname-only mode later.
    if (!seenByUrl.has(key)) {
      seenByUrl.set(key, tab);
    } else {
      // Duplicate found -> close
      try {
        await chrome.tabs.remove(tab.id);
        await incrementClosedToday(1);
        await notifyClosed(tab, 'Closed duplicate tab');
      } catch (e) {
        // ignore
      }
    }
  }
}

// Periodic check via chrome.alarms
async function runInactivitySweep() {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const now = Date.now();
  const timeoutMs = Math.max(1, settings.inactivityMinutes) * 60 * 1000;

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    if (tab.pinned) continue;
    if (isWhitelisted(tab.url, settings.whitelist)) continue;

    // If the tab is currently active (selected), mark as active now
    if (tab.active) {
      markActive(tab.id);
      continue;
    }

    const lastActive = tabLastActiveMs.get(tab.id) || now; // default to now when unknown
    const inactiveFor = now - lastActive;
    if (inactiveFor >= timeoutMs) {
      await closeForInactivity(tab);
      forgetTab(tab.id);
    }
  }

  // Also run duplicate cleanup periodically
  await closeDuplicateTabs();
}

// Alarm setup helper
async function ensureAlarm() {
  // Run every minute for responsiveness
  await chrome.alarms.create('stm-sweep', { periodInMinutes: 1 });
}

// Event wiring
chrome.runtime.onInstalled.addListener(async () => {
  // Initialize defaults if not present
  await setSettings(await getSettings());
  await ensureAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm && alarm.name === 'stm-sweep') {
    await runInactivitySweep();
  }
});

// Track focus/activation changes
chrome.tabs.onActivated.addListener(({ tabId }) => {
  markActive(tabId);
});

// Track tab updates that imply user activity (e.g., navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    markActive(tabId);
  }
});

// When a tab is removed, stop tracking
chrome.tabs.onRemoved.addListener((tabId) => {
  forgetTab(tabId);
});

// Messaging API for popup/options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message && message.type === 'GET_STATE') {
      const settings = await getSettings();
      const closedToday = await getClosedToday();
      sendResponse({ settings, closedToday });
      return;
    }
    if (message && message.type === 'SET_SETTINGS') {
      await setSettings(message.payload || {});
      await ensureAlarm();
      sendResponse({ ok: true });
      return;
    }
    if (message && message.type === 'RESTORE_LAST') {
      const last = restoreStack.shift();
      if (last && last.url) {
        await chrome.tabs.create({ url: last.url, active: false });
        sendResponse({ ok: true, restored: last });
      } else {
        sendResponse({ ok: false });
      }
      return;
    }
  })();
  // Return true to indicate async sendResponse
  return true;
});

/**
 * Smart Tab Manager - Background Script
 * Handles tab monitoring, duplicate detection, and auto-closing functionality
 */

class TabManager {
  constructor() {
    this.tabActivity = new Map(); // Track tab activity timestamps
    this.closedTabsHistory = []; // Store recently closed tabs for restore
    this.settings = {
      inactivityTimeout: 15, // minutes
      autoCloseDuplicates: true,
      whitelist: [],
      enabled: true,
      showNotifications: true
    };
    
    this.init();
  }

  /**
   * Initialize the tab manager
   */
  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start monitoring tabs
    this.startTabMonitoring();
    
    console.log('Smart Tab Manager initialized');
  }

  /**
   * Load settings from chrome storage
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
      
      // Initialize whitelist if not set
      if (!this.settings.whitelist) {
        this.settings.whitelist = [];
      }
      
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Save settings to chrome storage
   */
  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Set up event listeners for tab events
   */
  setupEventListeners() {
    // Track tab activity
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.updateTabActivity(activeInfo.tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.updateTabActivity(tabId);
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.tabActivity.delete(tabId);
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        this.loadSettings();
      }
    });

    // Handle messages from popup/options
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  /**
   * Handle messages from popup and options pages
   */
  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getStats':
        sendResponse({
          tabsClosedToday: await this.getTabsClosedToday(),
          enabled: this.settings.enabled
        });
        break;
        
      case 'toggleEnabled':
        this.settings.enabled = request.enabled;
        await this.saveSettings();
        sendResponse({ success: true });
        break;
        
      case 'getSettings':
        sendResponse(this.settings);
        break;
        
      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        await this.saveSettings();
        sendResponse({ success: true });
        break;
        
      case 'restoreLastTabs':
        const restored = await this.restoreLastTabs(request.count);
        sendResponse({ restored });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  /**
   * Update tab activity timestamp
   */
  updateTabActivity(tabId) {
    this.tabActivity.set(tabId, Date.now());
  }

  /**
   * Start monitoring tabs for inactivity and duplicates
   */
  startTabMonitoring() {
    // Check for inactive tabs every minute
    setInterval(() => {
      if (this.settings.enabled) {
        this.checkInactiveTabs();
        if (this.settings.autoCloseDuplicates) {
          this.checkDuplicateTabs();
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Check for inactive tabs and close them
   */
  async checkInactiveTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const now = Date.now();
      const timeoutMs = this.settings.inactivityTimeout * 60 * 1000;
      
      for (const tab of tabs) {
        // Skip pinned tabs
        if (tab.pinned) continue;
        
        // Skip whitelisted domains
        if (this.isWhitelisted(tab.url)) continue;
        
        // Skip chrome:// and extension pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
        
        const lastActivity = this.tabActivity.get(tab.id) || tab.lastAccessed;
        const inactiveTime = now - lastActivity;
        
        if (inactiveTime > timeoutMs) {
          await this.closeTab(tab, 'inactive');
        }
      }
    } catch (error) {
      console.error('Error checking inactive tabs:', error);
    }
  }

  /**
   * Check for duplicate tabs and close redundant ones
   */
  async checkDuplicateTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const urlGroups = new Map();
      
      // Group tabs by URL
      for (const tab of tabs) {
        if (tab.pinned || this.isWhitelisted(tab.url)) continue;
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
        
        const url = tab.url;
        if (!urlGroups.has(url)) {
          urlGroups.set(url, []);
        }
        urlGroups.get(url).push(tab);
      }
      
      // Close duplicate tabs, keeping the most recently active one
      for (const [url, tabGroup] of urlGroups) {
        if (tabGroup.length > 1) {
          // Sort by last activity (most recent first)
          tabGroup.sort((a, b) => {
            const aActivity = this.tabActivity.get(a.id) || a.lastAccessed;
            const bActivity = this.tabActivity.get(b.id) || b.lastAccessed;
            return bActivity - aActivity;
          });
          
          // Close all but the first (most recent) tab
          for (let i = 1; i < tabGroup.length; i++) {
            await this.closeTab(tabGroup[i], 'duplicate');
          }
        }
      }
    } catch (error) {
      console.error('Error checking duplicate tabs:', error);
    }
  }

  /**
   * Check if a URL is whitelisted
   */
  isWhitelisted(url) {
    if (!this.settings.whitelist || this.settings.whitelist.length === 0) {
      return false;
    }
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      return this.settings.whitelist.some(whitelistedDomain => {
        return domain.includes(whitelistedDomain) || whitelistedDomain.includes(domain);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Close a tab and handle cleanup
   */
  async closeTab(tab, reason) {
    try {
      // Store tab info for potential restore
      this.closedTabsHistory.unshift({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        timestamp: Date.now(),
        reason: reason
      });
      
      // Keep only last 50 closed tabs
      if (this.closedTabsHistory.length > 50) {
        this.closedTabsHistory = this.closedTabsHistory.slice(0, 50);
      }
      
      // Close the tab
      await chrome.tabs.remove(tab.id);
      
      // Update stats
      await this.updateTabsClosedToday();
      
      // Show notification if enabled
      if (this.settings.showNotifications) {
        this.showNotification(tab.title, reason);
      }
      
      console.log(`Closed ${reason} tab: ${tab.title}`);
      
    } catch (error) {
      console.error('Error closing tab:', error);
    }
  }

  /**
   * Show notification for closed tab
   */
  showNotification(title, reason) {
    const reasonText = reason === 'duplicate' ? 'duplicate' : 'unused';
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Smart Tab Manager',
      message: `Closed ${reasonText} tab: ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`
    });
  }

  /**
   * Update daily closed tabs count
   */
  async updateTabsClosedToday() {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['tabsClosedToday', 'lastResetDate']);
      
      let count = 0;
      if (result.lastResetDate === today) {
        count = result.tabsClosedToday || 0;
      }
      
      count++;
      
      await chrome.storage.local.set({
        tabsClosedToday: count,
        lastResetDate: today
      });
    } catch (error) {
      console.error('Error updating tabs closed count:', error);
    }
  }

  /**
   * Get tabs closed today count
   */
  async getTabsClosedToday() {
    try {
      const today = new Date().toDateString();
      const result = await chrome.storage.local.get(['tabsClosedToday', 'lastResetDate']);
      
      if (result.lastResetDate === today) {
        return result.tabsClosedToday || 0;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting tabs closed count:', error);
      return 0;
    }
  }

  /**
   * Restore last N closed tabs
   */
  async restoreLastTabs(count = 5) {
    try {
      const tabsToRestore = this.closedTabsHistory.slice(0, count);
      let restored = 0;
      
      for (const tabInfo of tabsToRestore) {
        try {
          await chrome.tabs.create({
            url: tabInfo.url,
            active: false
          });
          restored++;
        } catch (error) {
          console.error('Error restoring tab:', error);
        }
      }
      
      // Remove restored tabs from history
      this.closedTabsHistory = this.closedTabsHistory.slice(restored);
      
      return restored;
    } catch (error) {
      console.error('Error restoring tabs:', error);
      return 0;
    }
  }
}

// Initialize the tab manager when the service worker starts
const tabManager = new TabManager();
