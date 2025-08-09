/**
 * BSides South Jersey - Video Handler
 * Manages the devil video animation and playback functionality
 */

class VideoHandler {
    constructor() {
        this.isReversed = false; // Track if next play should be reversed
        this.reverseInterval = null; // Store interval for reverse playback
        this.isSafariIOS = this.detectSafariIOS();
        
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

// Initialize video handler
new VideoHandler();
