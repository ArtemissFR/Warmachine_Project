/**
 * CORE OPS - STATE MANAGER (ES Module)
 * Centralized Store for LocalStorage and Multi-tab Sync.
 */

export const State = {
  // --- HELPERS ---
  get(key, def) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : def;
    } catch (e) {
      console.error(`Error reading ${key}`, e);
      return def;
    }
  },

  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      // Manual trigger for current tab as storage event only fires for other tabs
      this.notifyListeners(key, val);
    } catch (e) {
      console.error(`Error saving ${key}`, e);
    }
  },

  // --- LISTENERS ---
  listeners: new Map(),

  subscribe(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(callback);
  },

  notifyListeners(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => cb(value));
    }
  },

  initSync() {
    window.addEventListener('storage', (e) => {
      if (this.listeners.has(e.key)) {
        try {
          const newVal = JSON.parse(e.newValue);
          this.notifyListeners(e.key, newVal);
        } catch (err) {
          console.warn("Storage sync failed", err);
        }
      }
    });
  }
};

// Initialize synchronization
State.initSync();
