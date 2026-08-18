/**
 * BSides South Jersey - Terminal Effects JavaScript
 * Provides typing animations and interactive terminal features
 */

// Terminal effect utilities
class TerminalEffects {
    constructor() {
        this.initializeEffects();
        this.setupEventListeners();
    }

    /**
     * Initialize all terminal effects on page load
     */
    initializeEffects() {
        this.addBlinkingCursors();
        this.addCommandPromptEffects();
        // Terminal title now uses pure CSS animation
    }

    /**
     * Add blinking cursors to elements with cursor class
     */
    addBlinkingCursors() {
        const elements = document.querySelectorAll('.add-cursor');
        elements.forEach(element => {
            const cursor = document.createElement('span');
            cursor.className = 'cursor';
            cursor.innerHTML = '█';
            element.appendChild(cursor);
        });
    }

    /**
     * Add command prompt interactive effects
     */
    addCommandPromptEffects() {
        const prompts = document.querySelectorAll('.interactive-prompt');
        
        prompts.forEach(prompt => {
            prompt.addEventListener('click', () => {
                this.executePromptCommand(prompt);
            });
        });
    }

    /**
     * Execute command prompt action
     * @param {HTMLElement} prompt - Clicked prompt element
     */
    executePromptCommand(prompt) {
        const command = prompt.dataset.command;
        const output = prompt.nextElementSibling;
        
        if (output && output.classList.contains('command-output')) {
            // Toggle output visibility with typing effect
            if (output.style.display === 'none' || !output.style.display) {
                output.style.display = 'block';
                this.typeText(output, output.dataset.text || output.textContent, 30);
            } else {
                output.style.display = 'none';
            }
        }
    }

    /**
     * Setup event listeners for interactive elements
     */
    setupEventListeners() {
        // Add hover effects to navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', this.playHoverSound);
            link.addEventListener('click', this.playClickSound);
        });

        // Add click effects to sponsor cards - DISABLED for static cards
        // const sponsorCards = document.querySelectorAll('.sponsor-card');
        // sponsorCards.forEach(card => {
        //     card.addEventListener('click', () => {
        //         this.highlightCard(card);
        //     });
        // });

        // Setup hamburger menu
        this.setupHamburgerMenu();

        // Setup speaker modal behavior
        this.setupSpeakerModal();

        // Thank you modal (post-event)
        this.setupThankYouModal();

        // Konami code easter egg
        this.setupKonamiCode();

        // .
        this.setupBsidesEasterEgg();
    }

    /**
     * Setup desktop speaker modal behavior
     */
    setupSpeakerModal() {
        const modal = document.getElementById('speakerModal');
        const closeButton = document.getElementById('speakerModalClose');
        const mobileQuery = window.matchMedia('(max-width: 768px)');

        if (!modal) {
            return;
        }

        if (modal.parentElement !== document.body) {
            document.body.appendChild(modal);
        }

        const modalPhoto = document.getElementById('speakerModalPhoto');
        const modalName = document.getElementById('speakerModalName');
        const modalRole = document.getElementById('speakerModalRole');
        const modalBio = document.getElementById('speakerModalBio');
        const backdrop = modal.querySelector('[data-close-speaker-modal]');

        const closeModal = () => {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('speaker-modal-open');
        };

        const openModal = (speakerCard) => {
            if (!speakerCard || mobileQuery.matches) {
                return;
            }

            const photo = speakerCard.querySelector('.speaker-photo');
            const name = speakerCard.querySelector('.speaker-name');
            const role = speakerCard.querySelector('.speaker-role');
            const preview = speakerCard.querySelector('.speaker-bio-preview');
            const expanded = speakerCard.querySelector('.speaker-bio-expanded');

            if (!photo || !name || !role || !preview || !expanded) {
                return;
            }

            modalPhoto.src = photo.src;
            modalPhoto.alt = photo.alt;
            modalName.textContent = name.textContent;
            modalRole.textContent = role.textContent;
            modalBio.innerHTML = expanded.innerHTML;

            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('speaker-modal-open');

            if (closeButton) {
                closeButton.focus();
            }
        };

        // Use event delegation so dynamically loaded speaker cards are handled.
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('.speaker-modal-trigger');
            if (trigger) {
                const card = trigger.closest('.speaker-card');
                openModal(card);
            }
        });

        if (closeButton) {
            closeButton.addEventListener('click', closeModal);
        }

        if (backdrop) {
            backdrop.addEventListener('click', closeModal);
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal.classList.contains('is-open')) {
                closeModal();
            }
        });

        if (typeof mobileQuery.addEventListener === 'function') {
            mobileQuery.addEventListener('change', (event) => {
                if (event.matches) {
                    closeModal();
                }
            });
        }
    }

    /**
     * Setup the post-event thank you modal.
     * Shows once per session on the home page.
     */
    setupThankYouModal() {
        const modal = document.getElementById('thankYouModal');
        if (!modal) return;

        // Keep the modal permanently visible on the home page and block dismissal.
        const path = window.location.pathname;
        const isHome = path === '/' || path === '/index.html' || path.endsWith('/index.html') || path.endsWith('/');
        if (!isHome) return;

        const openModal = () => {
            modal.classList.add('is-open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('speaker-modal-open');
        };

        // Prevent close interactions entirely.
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('is-open')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        setTimeout(openModal, 250);
    }

    /**
     * Itchy method.
     */
    resolveScratchChecksum() {
        const k = 0x3c ^ 0x66;
        const d = [0x09, 0x11, 0x03, 0x77, 0x18, 0x09, 0x14, 0x10, 0x77, 0x62, 0x6a, 0x68, 0x62];
        return String.fromCharCode(...d.map((v) => v ^ k));
    }

    /**
     * Setup hamburger menu functionality for mobile navigation
     * Simple, reliable approach without complex event handling
     */
    setupHamburgerMenu() {
        const hamburgerToggle = document.getElementById('hamburgerToggle');
        const navLinks = document.getElementById('navLinks');
        
        if (!hamburgerToggle || !navLinks) return;
        
        // Simple click handler - no complex debouncing or state tracking
        hamburgerToggle.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Simple toggle using CSS classes
            hamburgerToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            
            // Update aria-expanded for accessibility
            const isOpen = navLinks.classList.contains('active');
            hamburgerToggle.setAttribute('aria-expanded', isOpen);
        });
        
        // Close menu when clicking nav links
        const links = navLinks.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', function() {
                hamburgerToggle.classList.remove('active');
                navLinks.classList.remove('active');
                hamburgerToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerToggle.contains(e.target) && !navLinks.contains(e.target)) {
                hamburgerToggle.classList.remove('active');
                navLinks.classList.remove('active');
                hamburgerToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /**
     * Highlight sponsor card with terminal effect
     * @param {HTMLElement} card - Sponsor card element
     */
    highlightCard(card) {
        card.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
        card.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
            card.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
            card.style.transform = 'scale(1)';
        }, 300);
    }

    /**
     * Play hover sound effect (visual feedback)
     */
    playHoverSound() {
        // Visual feedback for hover (since we can't play actual sounds)
        console.log('> HOVER_DETECTED');
    }

    /**
     * Play click sound effect (visual feedback)
     */
    playClickSound() {
        // Visual feedback for click
        console.log('> CLICK_EXECUTED');
    }

    /**
     * .
     */
    _b64Utf8(raw) {
        const binary = atob(raw);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    }

    /**
     * Setup Konami code easter egg
     */
    setupKonamiCode() {
        const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (e.keyCode === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.activateEasterEgg();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });
    }

    /**
     * .
     */
    isCtfPage() {
        const segments = (window.location.pathname || '').split(/[/\\]/);
        const file = (segments.pop() || '').toLowerCase();
        return file === atob('Y3RmLmh0bWw=');
    }

    /**
     * Setup totally nothing).
     */
    setupBsidesEasterEgg() {
        if (!this.isCtfPage()) {
            return;
        }
        const z = 0x3c ^ 0x66;
        const ghost = String.fromCharCode(
            ...[0x38, 0x29, 0x33, 0x3e, 0x3f, 0x29].map((v) => v ^ z)
        );
        let q = '';
        const lim = ghost.length;
        const run = this[atob('YWN0aXZhdGVCc2lkZXNFYXN0ZXJFZ2c=')].bind(this);
        document.addEventListener('keydown', (e) => {
            if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                q = (q + e.key.toLowerCase()).slice(-lim);
                if (q === ghost) {
                    run();
                    q = '';
                }
            } else if ([8, 46, 27].includes(e.keyCode)) {
                q = '';
            }
        });
    }

    /**
     * Totally nothing).
     */
    activateBsidesEasterEgg() {
        const _ = atob;
        document.body.classList.add(_('Y3RmLWZsYWctdW5sb2NrZWQ='));

        const message = document.createElement('div');
        message.className = _('Y3RmLWJhY2tjaGFubmVsLW92ZXJsYXk=');
        message.setAttribute(_('cm9sZQ=='), _('ZGlhbG9n'));
        message.setAttribute(_('YXJpYS1sYWJlbA=='), _('QmFjayBjaGFubmVsIG1lc3NhZ2U='));
        message.innerHTML = this._b64Utf8(
            'PGRpdiBjbGFzcz0iY3RmLWJhY2tjaGFubmVsLWZyYW1lLXRvcCI+4pWU4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWQ4pWXPC9kaXY+PGRpdiBjbGFzcz0iY3RmLWJhY2tjaGFubmVsLWZyYW1lLW1pZCI+4pWRICAgSElEREVOIENIQU5ORUwgT1BFTiAgICAgIOKVkTwvZGl2PjxkaXYgY2xhc3M9ImN0Zi1iYWNrY2hhbm5lbC1mcmFtZS1ib3QiPuKVmuKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVkOKVnTwvZGl2PjxkaXYgY2xhc3M9ImN0Zi1iYWNrY2hhbm5lbC1tc2ciPk5pY2Ugd29yayDigJQgdGhhdCBwaHJhc2Ugb3BlbmVkIGEgYmFjayBjaGFubmVsLjwvZGl2PjxkaXYgY2xhc3M9ImN0Zi1iYWNrY2hhbm5lbC1sYWJlbCI+WW91ciBkcm9wOjwvZGl2PjxkaXYgY2xhc3M9ImN0Zi1iYWNrY2hhbm5lbC10b2tlbiB0LXNsb3QtcTkiPjwvZGl2PjxkaXYgY2xhc3M9ImN0Zi1iYWNrY2hhbm5lbC1kaXNtaXNzIj5DbGljayBhbnl3aGVyZSBvbiB0aGlzIGJveCB0byBkaXNtaXNzPC9kaXY+'
        );
        const tokenEl = message.querySelector('.' + _('dC1zbG90LXE5'));
        if (tokenEl) {
            tokenEl.textContent = this.resolveScratchChecksum();
        }

        const flagCls = _('Y3RmLWZsYWctdW5sb2NrZWQ=');
        const dismiss = () => {
            message.remove();
            window.setTimeout(() => {
                document.body.classList.remove(flagCls);
            }, 3000);
        };
        message.addEventListener('click', dismiss);

        document.body.appendChild(message);
    }

    /**
     * Activate easter egg effect
     */
    activateEasterEgg() {
        // Create matrix rain effect
        this.createMatrixRain();
        
        // Show easter egg message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #00FF00;
            padding: 20px;
            border: 2px solid #00FF00;
            border-radius: 8px;
            font-family: 'VT323', monospace;
            font-size: 24px;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 0 30px #00FF00;
        `;
        message.innerHTML = `
            <div>ACCESS GRANTED</div>
            <div style="font-size: 16px; margin-top: 10px;">Welcome to the Matrix, hacker!</div>
            <div style="font-size: 14px; margin-top: 10px; cursor: pointer;" onclick="this.parentElement.remove()">
                [PRESS ANY KEY TO CONTINUE]
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 5000);
    }

    /**
     * Create matrix rain effect
     */
    createMatrixRain() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9998;
            pointer-events: none;
        `;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        document.body.appendChild(canvas);
        
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const drops = [];
        
        for (let x = 0; x < canvas.width / 10; x++) {
            drops[x] = 1;
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00FF00';
            ctx.font = '15px VT323';
            
            for (let i = 0; i < drops.length; i++) {
                const text = matrix[Math.floor(Math.random() * matrix.length)];
                ctx.fillText(text, i * 10, drops[i] * 10);
                
                if (drops[i] * 10 > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        
        const matrixInterval = setInterval(draw, 35);
        
        // Stop matrix after 10 seconds
        setTimeout(() => {
            clearInterval(matrixInterval);
            canvas.remove();
        }, 10000);
    }
}

/**
 * Date and time utilities for event information
 */
class DateTimeUtils {
    /**
     * Format date in terminal style
     * @param {Date} date - Date to format
     * @returns {string} Formatted date string
     */
    static formatTerminalDate(date) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options).toUpperCase();
    }

    /**
     * Get current system time in terminal format
     * @returns {string} Current time string
     */
    static getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Initialize terminal effects when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TerminalEffects();
    
    // Update current time every second
    const timeElements = document.querySelectorAll('.current-time');
    if (timeElements.length > 0) {
        setInterval(() => {
            timeElements.forEach(element => {
                element.textContent = DateTimeUtils.getCurrentTime();
            });
        }, 1000);
    }
    
    // Add event listener for scroll to speakers button
    const scrollButton = document.getElementById('scroll-to-speakers-btn');
    if (scrollButton) {
        scrollButton.addEventListener('click', scrollToSpeakers);
    }
    
    // Add loading effect
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 1s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TerminalEffects, DateTimeUtils };
}

/**
 * Smooth scroll to the Call for Speakers section
 */
function scrollToSpeakers() {
    console.log('scrollToSpeakers function called'); // Debug log
    const speakersSection = document.getElementById('call-for-speakers');
    console.log('Found speakers section:', speakersSection); // Debug log
    
    if (speakersSection) {
        speakersSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // Optional: Add a slight highlight effect when scrolled to
        speakersSection.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        setTimeout(() => {
            speakersSection.style.backgroundColor = 'rgba(0, 255, 0, 0.05)';
        }, 1000);
    } else {
        console.error('Could not find element with id: call-for-speakers');
    }
}

// Make sure the function is available globally
window.scrollToSpeakers = scrollToSpeakers;

// Export for use in other scripts if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TerminalEffects, DateTimeUtils, scrollToSpeakers };
}
