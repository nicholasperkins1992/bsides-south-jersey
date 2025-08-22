/**
 * BSides South Jersey - Page Configuration
 * Handles page-level configuration and feature flags
 */

class PageConfig {
    constructor() {
        this.ENABLE_SPLASH_ONLY = false; // Feature flag for splash only mode
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
            // Check if we're not on the home page
            const currentPath = window.location.pathname;
            const isHomePage = currentPath === '/' || 
                              currentPath === '/index.html' || 
                              currentPath.endsWith('/index.html') ||
                              currentPath.endsWith('/');
            
            if (!isHomePage) {
                // Redirect to home page when splash mode is active
                window.location.href = 'index.html';
                return;
            }
            
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
