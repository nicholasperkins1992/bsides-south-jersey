/**
 * BSides South Jersey - Video Handler
 * Manages the devil video animation and playback functionality
 */

class VideoHandler {
    constructor() {
        this.isReversed = false; // Track if next play should be reversed
        this.reverseInterval = null; // Store interval for reverse playback
        this.isSafariIOS = this.detectSafariIOS();
        this.mobileEasterEgg = new MobileEasterEgg(); // Initialize mobile Easter egg
        
        this.init();
    }

    /**
     * Detect Safari iOS for specific handling
     * @returns {boolean} True if Safari on iOS
     */
    detectSafariIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent);
    }

    /**
     * Initialize video handler
     */
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeVideo();
            this.scheduleNextPlay();
            this.setupVideoEventListeners();
        });
    }

    /**
     * Set up video event listeners
     */
    setupVideoEventListeners() {
        const video = document.getElementById('devil-video');
        if (video) {
            // Remove inline event handlers and use proper event listeners
            video.addEventListener('ended', () => this.handleVideoEnd());
            video.addEventListener('loadeddata', () => {
                video.currentTime = 0;
                video.playbackRate = 1;
            });
        }
    }

    /**
     * Handle video end event
     */
    handleVideoEnd() {
        const video = document.getElementById('devil-video');
        if (video) {
            video.pause();
            this.scheduleNextPlay();
        }
    }

    /**
     * Play video in reverse using manual frame stepping
     * @param {HTMLVideoElement} video - Video element to play in reverse
     */
    playReverse(video) {
        // Clear any existing reverse interval
        if (this.reverseInterval) {
            clearInterval(this.reverseInterval);
        }
        
        // Start from the end
        video.currentTime = video.duration || 3;
        video.pause(); // Make sure video is paused
        
        // Manually step backwards through the video
        // Use longer intervals for Safari iOS for better performance
        const stepInterval = this.isSafariIOS ? 100 : 50;
        const stepSize = this.isSafariIOS ? 0.15 : 0.1;
        
        this.reverseInterval = setInterval(() => {
            if (video.currentTime <= 0.1) {
                // Reached the beginning, stop reverse playback
                clearInterval(this.reverseInterval);
                this.reverseInterval = null;
                this.scheduleNextPlay();
            } else {
                // Step backwards by small increments (adjust for Safari iOS)
                video.currentTime = Math.max(0, video.currentTime - stepSize);
            }
        }, stepInterval);
    }

    /**
     * Schedule the next video play with random delay
     */
    scheduleNextPlay() {
        // Random interval between 15-35 seconds (15000-35000 milliseconds)
        // Slightly longer intervals for Safari iOS to improve performance
        const baseDelay = 15000;
        const randomRange = this.isSafariIOS ? 25000 : 20000;
        const randomDelay = Math.floor(Math.random() * randomRange) + baseDelay;
        
        setTimeout(() => {
            const video = document.getElementById('devil-video');
            if (video) {
                // Toggle direction for next play
                this.isReversed = !this.isReversed;
                
                if (this.isReversed) {
                    // Play in reverse using manual control
                    this.playReverse(video);
                } else {
                    // Play normally: start from beginning
                    video.currentTime = 0;
                    video.playbackRate = 1; // Ensure normal playback rate
                    
                    // Safari iOS specific play handling
                    if (this.isSafariIOS) {
                        // Force play on Safari iOS with error handling
                        const playPromise = video.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                console.log("Safari iOS autoplay prevented:", error);
                                // Fallback: try again after user interaction
                            });
                        }
                    } else {
                        video.play();
                    }
                }
            }
        }, randomDelay);
    }

    /**
     * Enhanced video initialization for Safari iOS
     */
    initializeVideo() {
        const video = document.getElementById('devil-video');
        if (video && this.isSafariIOS) {
            // Safari iOS specific initialization
            video.load(); // Preload the video
            
            // Attempt initial play with error handling
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Safari iOS initial autoplay prevented:", error);
                    
                    // Add user interaction listener for Safari iOS
                    const enableAutoplay = () => {
                        video.play();
                        document.removeEventListener('touchstart', enableAutoplay);
                        document.removeEventListener('click', enableAutoplay);
                    };
                    
                    document.addEventListener('touchstart', enableAutoplay, { once: true });
                    document.addEventListener('click', enableAutoplay, { once: true });
                });
            }
        }
    }
}

/**
 * Mobile Easter Egg Handler
 * Handles the long press Easter egg on mobile devices
 */
class MobileEasterEgg {
    constructor() {
        this.pressTimer = null;
        this.countdownTimer = null;
        this.pressStartTime = 0;
        this.isPressed = false;
        this.isMobile = this.detectMobile();
        this.isActive = false;
        this.progressIndicator = null;
        
        if (this.isMobile) {
            this.init();
        }
    }

    /**
     * Detect if device is mobile
     * @returns {boolean} True if mobile device
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    /**
     * Initialize mobile Easter egg
     */
    init() {
        const video = document.getElementById('devil-video');
        if (video) {
            // Touch events for mobile devices
            video.addEventListener('touchstart', (e) => this.handlePressStart(e), { passive: false });
            video.addEventListener('touchend', (e) => this.handlePressEnd(e), { passive: false });
            video.addEventListener('touchcancel', (e) => this.handlePressEnd(e), { passive: false });
            
            // Mouse events for desktop testing
            video.addEventListener('mousedown', (e) => this.handlePressStart(e), { passive: false });
            video.addEventListener('mouseup', (e) => this.handlePressEnd(e), { passive: false });
            video.addEventListener('mouseleave', (e) => this.handlePressEnd(e), { passive: false });
        }
    }

    /**
     * Handle press start (touchstart/mousedown)
     * @param {Event} e - Touch or mouse event
     */
    handlePressStart(e) {
        // Only process on mobile devices (but allow desktop for testing)
        if (!this.isMobile && !e.type.startsWith('mouse')) return;
        
        // Prevent default to avoid video controls
        e.preventDefault();
        e.stopPropagation();
        
        // Don't start if already active
        if (this.isActive || this.isPressed) return;
        
        this.isPressed = true;
        this.pressStartTime = Date.now();
        
        // Show progress indicator
        this.showProgressIndicator();
        
        // Start countdown timer
        this.pressTimer = setTimeout(() => {
            this.activateEasterEgg();
        }, 10000); // 10 second long press
        
        // Start countdown display
        this.startCountdown();
    }

    /**
     * Handle press end (touchend/mouseup/touchcancel/mouseleave)
     * @param {Event} e - Touch or mouse event
     */
    handlePressEnd(e) {
        if (!this.isPressed) return;
        
        // Calculate how long the press was
        const pressDuration = Date.now() - this.pressStartTime;
        
        // Clear the timers
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        // Hide progress indicator
        this.hideProgressIndicator();
        
        // Reset state
        this.isPressed = false;
        this.pressStartTime = 0;
        
        // If press was less than 10 seconds, show hint
        if (pressDuration < 10000 && pressDuration > 1000) {
            this.showHint();
        }
    }

    /**
     * Show progress indicator during long press
     */
    showProgressIndicator() {
        this.progressIndicator = document.createElement('div');
        this.progressIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            border: 3px solid rgba(0, 255, 0, 0.3);
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-family: 'VT323', monospace;
            color: #00ff00;
            font-size: 14px;
            text-align: center;
        `;
        
        this.progressIndicator.innerHTML = `
            <div style="margin-bottom: 10px;">🎭</div>
            <div>Hold for Easter egg...</div>
            <div id="countdown-display" style="
                margin: 10px 0;
                font-size: 24px;
                font-weight: bold;
                color: #00ff41;
            ">10</div>
            <div style="margin-top: 10px;">
                <div id="progress-circle" style="
                    width: 60px;
                    height: 60px;
                    border: 2px solid rgba(0, 255, 0, 0.3);
                    border-radius: 50%;
                    border-top: 2px solid #00ff00;
                    animation: progressSpin 10s linear;
                "></div>
            </div>
        `;
        
        // Add CSS animation for progress circle
        const style = document.createElement('style');
        style.textContent = `
            @keyframes progressSpin {
                0% { transform: rotate(0deg); opacity: 0.3; }
                100% { transform: rotate(3600deg); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(this.progressIndicator);
    }

    /**
     * Start countdown display
     */
    startCountdown() {
        let timeLeft = 10;
        const countdownDisplay = document.getElementById('countdown-display');
        
        this.countdownTimer = setInterval(() => {
            timeLeft--;
            if (countdownDisplay) {
                countdownDisplay.textContent = timeLeft;
                
                // Add visual emphasis as countdown gets lower
                if (timeLeft <= 3) {
                    countdownDisplay.style.color = '#ff4444';
                    countdownDisplay.style.textShadow = '0 0 10px #ff4444';
                } else if (timeLeft <= 5) {
                    countdownDisplay.style.color = '#ffff00';
                    countdownDisplay.style.textShadow = '0 0 10px #ffff00';
                }
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
            }
        }, 1000);
    }

    /**
     * Hide progress indicator
     */
    hideProgressIndicator() {
        if (this.progressIndicator) {
            this.progressIndicator.remove();
            this.progressIndicator = null;
        }
    }

    /**
     * Show hint when press is released early
     */
    showHint() {
        const hintDiv = document.createElement('div');
        hintDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 15px 20px;
            border: 1px solid #00ff00;
            border-radius: 5px;
            font-family: 'VT323', monospace;
            font-size: 16px;
            text-align: center;
            z-index: 9999;
            pointer-events: none;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        hintDiv.innerHTML = `Hold the devil for 10 seconds! 👹`;
        
        document.body.appendChild(hintDiv);
        
        // Remove hint after animation
        setTimeout(() => {
            hintDiv.remove();
        }, 2000);
    }

    /**
     * Activate the matrix Easter egg effect
     */
    activateEasterEgg() {
        if (this.isActive) return; // Prevent multiple activations

        this.isActive = true;

        // Hide progress indicator immediately
        this.hideProgressIndicator();

        // Trigger the matrix effect directly (no success message)
        try {
            if (typeof TerminalEffects !== 'undefined') {
                const terminalEffects = new TerminalEffects();
                if (typeof terminalEffects.createMatrixRain === 'function') {
                    terminalEffects.createMatrixRain();
                } else {
                    console.log('Matrix rain effect not available');
                }
            } else {
                console.log('TerminalEffects not loaded');
            }
        } catch (error) {
            console.log('Error triggering matrix effect:', error);
        }

        // Reset after effect completes
        setTimeout(() => {
            this.isActive = false;
        }, 12000); // Slightly longer than matrix effect duration
    }

    /**
     * Show Easter egg activation message
     */
    showEasterEggMessage() {
        // Create overlay message
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 8px;
            font-family: 'VT323', monospace;
            font-size: 18px;
            text-align: center;
            z-index: 9999;
            pointer-events: none;
            animation: fadeInOut 3s ease-in-out;
        `;
        
        messageDiv.innerHTML = `
            <div>🎭 EASTER EGG ACTIVATED! 🎭</div>
            <div style="margin-top: 10px; font-size: 14px;">You found the secret devil long press!</div>
            <div style="margin-top: 5px; font-size: 12px;">Patience is a hacker's virtue...</div>
        `;

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(messageDiv);

        // Remove message after animation
        setTimeout(() => {
            messageDiv.remove();
            style.remove();
        }, 3000);
    }
}

// Initialize video handler
new VideoHandler();
