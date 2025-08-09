/**
 * BSides South Jersey - Page Configuration
 * Handles page-level configuration and feature flags
 */

class PageConfig {
    constructor() {
        this.ENABLE_SPLASH_ONLY = true; // Feature flag for splash only mode
        this.init();
    }

    /**
     * Initialize page configuration
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.applySplashMode();
        });
    }

    /**
     * Apply splash mode if enabled
     */
    applySplashMode() {
        if (this.ENABLE_SPLASH_ONLY) {
            document.documentElement.classList.add('splash-only');
        }
    }

    /**
     * Toggle splash mode
     * @param {boolean} enabled - Whether to enable splash mode
     */
    setSplashMode(enabled) {
        this.ENABLE_SPLASH_ONLY = enabled;
        if (enabled) {
            document.documentElement.classList.add('splash-only');
        } else {
            document.documentElement.classList.remove('splash-only');
        }
    }

    /**
     * Get current splash mode status
     * @returns {boolean} Current splash mode status
     */
    getSplashMode() {
        return this.ENABLE_SPLASH_ONLY;
    }
}

// Initialize page configuration
new PageConfig();
