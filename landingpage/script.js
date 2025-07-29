// Claude Autopilot Landing Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all animations and interactions
    initAnimations();
    initInteractiveElements();
    initCounters();
    initScrollEffects();
    initTypingAnimation();
    initProgressBar();
});

// Animated Counter for Statistics
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const observerOptions = {
        threshold: 0.7,
        rootMargin: '0px 0px -100px 0px'
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const increment = target / 200;
    let current = 0;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 10);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M+';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString();
}

// GitHub Stars Counter Animation
function initAnimations() {
    const starCount = document.getElementById('star-count');
    if (starCount) {
        // Fetch real GitHub star count
        fetchGitHubStars();
    }

    // Floating code lines effect
    createFloatingCodeLines();
}

// Fetch real GitHub stars count
async function fetchGitHubStars() {
    const starCount = document.getElementById('star-count');
    if (!starCount) return;

    try {
        const response = await fetch('https://api.github.com/repos/benbasha/Claude-Autopilot');
        const data = await response.json();
        
        if (data.stargazers_count !== undefined) {
            setTimeout(() => {
                animateStarCount(starCount, data.stargazers_count);
            }, 1000);
        } else {
            // Fallback to static count
            setTimeout(() => {
                animateStarCount(starCount, 12);
            }, 1000);
        }
    } catch (error) {
        console.warn('Could not fetch GitHub stars:', error);
        // Fallback to static count
        setTimeout(() => {
            animateStarCount(starCount, 12);
        }, 1000);
    }
}

function animateStarCount(element, target) {
    let current = 0;
    const increment = target / 100;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 20);
}

// Interactive Elements
function initInteractiveElements() {
    // Demo video placeholder interaction
    const videoPlaceholder = document.querySelector('.video-placeholder');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function() {
            // Simulate video play - in real implementation, this would open a modal or play video
            this.innerHTML = `
                <div class="video-playing">
                    <div class="video-controls">
                        <div class="progress-line"></div>
                        <p>Demo: Complete workflow (2:34)</p>
                    </div>
                </div>
            `;
            this.style.background = 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(123, 104, 238, 0.1))';
        });
    }

    // Interactive phone mockup
    const phoneScreen = document.querySelector('.phone-screen');
    if (phoneScreen) {
        phoneScreen.addEventListener('click', function() {
            const mobileInterface = this.querySelector('.mobile-interface');
            mobileInterface.classList.add('active-demo');
            
            // Simulate queue updates
            setTimeout(() => {
                updateQueueDemo();
            }, 1000);
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // CTA button glow effect
    initButtonEffects();
}

function initButtonEffects() {
    const ctaButtons = document.querySelectorAll('.cta-button.primary');
    
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px) scale(1.02)';
            this.style.boxShadow = '0 0 40px rgba(0, 212, 255, 0.6)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
        });
        
        button.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Terminal Typing Animation
function initTypingAnimation() {
    const terminalLines = document.querySelectorAll('.terminal-line');
    let delay = 0;

    // Observer for terminal animation
    const terminalObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    animateTerminalLines();
                }, 500);
                terminalObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const terminal = document.querySelector('.fake-terminal');
    if (terminal) {
        terminalObserver.observe(terminal);
    }
}

function animateTerminalLines() {
    const lines = [
        "📱 Web interface: http://localhost:3000",
        "⏳ Queue: 23 tasks remaining",
        "✅ Completed: 25/48 tasks",
        "🚀 Processing: \"Build React components\""
    ];

    const terminalContent = document.querySelector('.terminal-content');
    if (!terminalContent) return;

    // Clear existing content except prompt
    const promptLine = terminalContent.querySelector('.terminal-line');
    terminalContent.innerHTML = '';
    terminalContent.appendChild(promptLine);

    lines.forEach((line, index) => {
        setTimeout(() => {
            const lineElement = document.createElement('div');
            lineElement.className = 'terminal-line';
            lineElement.textContent = line;
            terminalContent.appendChild(lineElement);
            
            // Add typing effect
            typeText(lineElement, line);
        }, index * 800);
    });

    // Add blinking cursor at the end
    setTimeout(() => {
        const cursorLine = document.createElement('div');
        cursorLine.className = 'terminal-line typing';
        cursorLine.innerHTML = '<span class="cursor">_</span>';
        terminalContent.appendChild(cursorLine);
    }, lines.length * 800 + 500);
}

function typeText(element, text) {
    element.textContent = '';
    let i = 0;
    
    const typeInterval = setInterval(() => {
        element.textContent += text[i];
        i++;
        
        if (i >= text.length) {
            clearInterval(typeInterval);
        }
    }, 50);
}

// Progress Bar Animation
function initProgressBar() {
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target.querySelector('.progress');
                if (progressBar) {
                    setTimeout(() => {
                        progressBar.style.width = '52%';
                    }, 500);
                }
                progressObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const phoneDemo = document.querySelector('.phone-mockup-interactive');
    if (phoneDemo) {
        progressObserver.observe(phoneDemo);
    }
}

// Queue Demo Updates
function updateQueueDemo() {
    const queueItems = document.querySelectorAll('.queue-item');
    let currentIndex = 0;

    const updateInterval = setInterval(() => {
        // Remove active class from current item
        queueItems[currentIndex].classList.remove('active');
        queueItems[currentIndex].style.opacity = '0.5';
        
        // Move to next item
        currentIndex++;
        
        if (currentIndex < queueItems.length) {
            queueItems[currentIndex].classList.add('active');
            
            // Update progress bar
            const progress = document.querySelector('.progress');
            const percentage = ((currentIndex + 1) / queueItems.length) * 100;
            progress.style.width = `${percentage}%`;
            
        } else {
            clearInterval(updateInterval);
            // Show completion state
            setTimeout(() => {
                showCompletionState();
            }, 1000);
        }
    }, 2000);
}

function showCompletionState() {
    const mobileInterface = document.querySelector('.mobile-interface');
    if (mobileInterface) {
        mobileInterface.innerHTML = `
            <h4 style="color: var(--success-green);">✅ All Tasks Complete!</h4>
            <div class="progress-bar">
                <div class="progress" style="width: 100%; background: var(--success-green);"></div>
            </div>
            <p>48/48 tasks completed</p>
            <div class="queue-item" style="border-color: var(--success-green); background: rgba(46, 160, 67, 0.1);">
                All done! Go to sleep 😴
            </div>
        `;
    }
}

// Scroll Effects
function initScrollEffects() {
    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const background = document.querySelector('.matrix-rain');
        
        if (background) {
            background.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });

    // Fade in animations for sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                sectionObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all major sections
    document.querySelectorAll('section').forEach(section => {
        sectionObserver.observe(section);
    });

    // Feature cards stagger animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Matrix Rain Effect
function createMatrixRain() {
    const matrixRain = document.querySelector('.matrix-rain');
    if (!matrixRain) return;

    // Create falling code characters
    const characters = '01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]()<>/*+-=_|\\~`!@#$%^&*';
    const columns = Math.floor(window.innerWidth / 20);

    for (let i = 0; i < columns; i++) {
        setTimeout(() => {
            createMatrixColumn(matrixRain, characters, i);
        }, i * 100);
    }
}

function createMatrixColumn(container, chars, columnIndex) {
    const column = document.createElement('div');
    column.style.cssText = `
        position: absolute;
        left: ${columnIndex * 20}px;
        top: 0;
        font-family: monospace;
        font-size: 14px;
        color: rgba(0, 212, 255, 0.8);
        animation: matrix-fall 10s linear infinite;
        animation-delay: ${Math.random() * 5}s;
    `;

    const text = Array.from({ length: 20 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
    ).join('<br>');
    
    column.innerHTML = text;
    container.appendChild(column);

    // Remove and recreate periodically
    setTimeout(() => {
        if (column.parentNode) {
            column.parentNode.removeChild(column);
            createMatrixColumn(container, chars, columnIndex);
        }
    }, 10000 + Math.random() * 5000);
}

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes matrix-fall {
        0% { transform: translateY(-100vh); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
    }

    .active-demo {
        animation: phone-pulse 2s ease-in-out infinite;
    }

    @keyframes phone-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
    }

    .video-playing {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .video-controls {
        text-align: center;
    }

    .progress-line {
        width: 200px;
        height: 4px;
        background: var(--border-color);
        border-radius: 2px;
        margin: 0 auto 1rem;
        position: relative;
        overflow: hidden;
    }

    .progress-line::after {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 60%;
        background: linear-gradient(90deg, var(--primary-cyan), var(--accent-purple));
        border-radius: 2px;
        animation: progress-move 3s ease-in-out infinite;
    }

    @keyframes progress-move {
        0% { width: 0%; }
        50% { width: 60%; }
        100% { width: 100%; }
    }

    #star-count {
        transition: all 0.3s ease;
        display: inline-block;
    }

    .github-stars {
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s ease;
    }

    .github-stars:hover #star-count {
        transform: scale(1.1);
    }

    .github-stars:hover {
        background: rgba(255, 215, 0, 0.1) !important;
        border-color: #FFD700 !important;
        color: inherit !important;
        text-decoration: none !important;
    }

    @keyframes star-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }

    .star-clicked {
        animation: star-pulse 0.3s ease-in-out;
    }
`;
document.head.appendChild(style);

// Error handling and performance optimization
window.addEventListener('error', function(e) {
    console.warn('Animation error:', e.message);
});

// Reduce animations on low-performance devices
if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    document.body.classList.add('reduced-motion');
    
    const reducedMotionStyle = document.createElement('style');
    reducedMotionStyle.textContent = `
        .reduced-motion * {
            animation-duration: 0.1s !important;
            transition-duration: 0.1s !important;
        }
    `;
    document.head.appendChild(reducedMotionStyle);
}

// Social sharing functionality
function shareOnTwitter(text, url) {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
}

function shareOnReddit(title, url) {
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank');
}

// Add social sharing event listeners
document.addEventListener('click', function(e) {
    if (e.target.matches('.share-btn.twitter')) {
        e.preventDefault();
        shareOnTwitter(
            "Finally, an extension that gets your relationship status: 'It's complicated (because of code)' #ClaudeAutopilot #VsCode", 
            window.location.href
        );
    }
    
    if (e.target.matches('.share-btn.reddit')) {
        e.preventDefault();
        shareOnReddit(
            "Stop Fighting With Your Girlfriend - Claude Autopilot VS Code Extension", 
            window.location.href
        );
    }
});

// Analytics tracking (placeholder - replace with actual analytics)
function trackEvent(eventName, properties = {}) {
    // Replace with your analytics implementation
    console.log('Event tracked:', eventName, properties);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
}

// GitHub Star functionality
function openGitHubForStarring() {
    // Open GitHub repository for starring
    const gitHubUrl = 'https://github.com/benbasha/Claude-Autopilot';
    window.open(gitHubUrl, '_blank');
    
    // Optimistically increment the star count with animation
    const starCountElement = document.getElementById('star-count');
    if (starCountElement) {
        const currentCount = parseInt(starCountElement.textContent.replace(/,/g, '')) || 0;
        
        // Add a temporary visual feedback
        starCountElement.style.transform = 'scale(1.2)';
        starCountElement.style.color = '#FFD700';
        
        setTimeout(() => {
            starCountElement.style.transform = 'scale(1)';
            starCountElement.style.color = '';
            
            // Optimistically show +1 (will be corrected on next API fetch)
            animateStarCount(starCountElement, currentCount + 1);
        }, 300);
        
        // Refresh the real count after a delay
        setTimeout(() => {
            fetchGitHubStars();
        }, 2000);
    }
    
    trackEvent('github_star_attempt');
}

// Track important interactions
document.addEventListener('click', function(e) {
    if (e.target.matches('.cta-button.primary')) {
        trackEvent('cta_click', { button: 'primary', location: e.target.closest('section')?.className || 'unknown' });
    }
    
    if (e.target.matches('.share-btn')) {
        trackEvent('share_click', { platform: e.target.className.split(' ').pop() });
    }
    
    if (e.target.matches('[href*="github"]')) {
        // Check if this is a star button
        if (e.target.textContent.includes('Star') || e.target.textContent.includes('⭐')) {
            e.preventDefault();
            openGitHubForStarring();
        } else {
            trackEvent('github_click');
        }
    }
    
    if (e.target.matches('[href*="marketplace.visualstudio.com"]')) {
        trackEvent('marketplace_click');
    }
});

// Track demo interactions
document.addEventListener('click', function(e) {
    if (e.target.closest('.video-placeholder')) {
        trackEvent('demo_video_click');
    }
    
    if (e.target.closest('.phone-mockup-interactive')) {
        trackEvent('mobile_demo_click');
    }
});

// Page load performance tracking
window.addEventListener('load', function() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    trackEvent('page_load_time', { load_time: loadTime });
    
    // Track Core Web Vitals if available
    if ('web-vitals' in window) {
        // Implementation would depend on web-vitals library
    }
});

// Floating Code Lines Effect
function createFloatingCodeLines() {
    const container = document.querySelector('.floating-code-lines');
    if (!container) return;

    const codeSnippets = [
        'const girlfriend = happy ? true : runClaudeFromBed();',
        'if (laptop.glowing && bedtime) { usePhone(); }',
        'async function saveRelationship() { return mobile.control; }',
        'claude.autopilot.start({ mobile: true });',
        'queue.process(tasks).then(sleep);',
        '// No more screen glow arguments',
        'export const happiness = mobile + claude;',
        'interface Relationship { happy: boolean; }',
        'npm install claude-autopilot --save-relationship',
        'git commit -m "Fix relationship status"',
        'docker run -d happiness --no-laptop-glow',
        'func processWhileSleeping() -> Bool { return true }',
        'SELECT * FROM tasks WHERE status = "completed";',
        'curl -X POST /api/mobile-control',
        '<div class="no-more-fights">❤️</div>',
        'python manage.py make_girlfriend_happy',
        'let bedtimeCoding = mobile && !screenGlow;',
        'class HappyRelationship extends NoLaptopInBed {}',
        'const mobileControl = new ClaudeAutopilot();',
        'rm -rf relationship-problems'
    ];

    function createCodeLine() {
        const line = document.createElement('div');
        line.className = 'code-line';
        line.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        
        // Random vertical position
        line.style.top = Math.random() * 100 + '%';
        
        // Random animation duration (8-15 seconds)
        const duration = 8 + Math.random() * 7;
        line.style.animationDuration = duration + 's';
        
        // Random delay before starting
        line.style.animationDelay = Math.random() * 3 + 's';
        
        container.appendChild(line);
        
        // Remove line after animation completes
        setTimeout(() => {
            if (line.parentNode) {
                line.parentNode.removeChild(line);
            }
        }, (duration + 3) * 1000);
    }

    // Create initial lines
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createCodeLine(), i * 800);
    }

    // Continuously create new lines
    setInterval(() => {
        if (Math.random() > 0.3) { // 70% chance to create a new line
            createCodeLine();
        }
    }, 2000);
}

console.log('🚀 Claude Autopilot landing page loaded successfully!');
console.log('💡 Ready to save relationships and boost productivity!');