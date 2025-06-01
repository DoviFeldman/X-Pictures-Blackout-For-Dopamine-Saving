// content.js    X.com Image Blackout Extension
(function() {
    'use strict';

    // Selectors for timeline media (excluding profile pictures)
    const MEDIA_SELECTORS = [
        '[data-testid="tweetPhoto"] img',
        '[data-testid="tweetPhoto"] div[style*="background-image"]',
        '[data-testid="videoComponent"] video',
        '[data-testid="videoComponent"] div[style*="background-image"]',
        'article div[style*="background-image"]:not([data-testid="UserAvatar"])',
        'article img:not([data-testid="UserAvatar"]):not([alt*="profile"])'
    ];

    // Selectors to exclude (profile pictures, avatars, etc.)
    const EXCLUDE_SELECTORS = [
        '[data-testid="UserAvatar"]',
        '[role="button"] img',
        'img[alt*="profile"]',
        'img[alt*="avatar"]',
        '.css-175oi2r[style*="32px"]', // Small profile images
        '.css-175oi2r[style*="40px"]'  // Medium profile images
    ];

    function isExcludedElement(element) {
        // Check if element or its parents match exclude selectors
        for (const selector of EXCLUDE_SELECTORS) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        }
        
        // Additional checks for small images (likely avatars)
        if (element.tagName === 'IMG') {
            const rect = element.getBoundingClientRect();
            if (rect.width <= 48 && rect.height <= 48) {
                return true; // Likely a small avatar/icon
            }
        }

        return false;
    }

    function blackoutElement(element) {
        if (isExcludedElement(element)) {
            return;
        }

        // Skip if already processed
        if (element.classList.contains('timeline-image-blackout') || 
            element.classList.contains('timeline-image-revealed')) {
            return;
        }

        if (element.tagName === 'VIDEO') {
            // Handle video elements
            const container = element.closest('[data-testid="videoComponent"]') || element.parentElement;
            if (container && !container.querySelector('.video-blackout-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'video-blackout-overlay';
                overlay.innerHTML = '🎥 Click to reveal video';
                overlay.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    overlay.classList.add('revealed');
                });
                
                // Position overlay relative to container
                if (container.style.position !== 'relative' && container.style.position !== 'absolute') {
                    container.style.position = 'relative';
                }
                container.appendChild(overlay);
            }
        } else {
            // Handle images and background images
            element.classList.add('timeline-image-blackout');
            
            element.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                
                element.classList.remove('timeline-image-blackout');
                element.classList.add('timeline-image-revealed');
            });
        }
    }

    function processNewElements() {
        // Find all timeline media elements
        MEDIA_SELECTORS.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                // Additional check to ensure it's in the main timeline
                const article = element.closest('article');
                if (article || element.closest('[data-testid="primaryColumn"]')) {
                    blackoutElement(element);
                }
            });
        });
    }

    // Initial processing
    processNewElements();

    // Create observer for dynamic content
    const observer = new MutationObserver(function(mutations) {
        let shouldProcess = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Check if new nodes contain media elements
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.querySelector && (
                            node.querySelector('[data-testid="tweetPhoto"]') ||
                            node.querySelector('[data-testid="videoComponent"]') ||
                            node.matches('article') ||
                            node.querySelector('article')
                        )) {
                            shouldProcess = true;
                        }
                    }
                });
            }
        });
        
        if (shouldProcess) {
            // Delay processing slightly to ensure DOM is stable
            setTimeout(processNewElements, 100);
        }
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Re-process when scrolling (for lazy-loaded content)
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(processNewElements, 200);
    });

    console.log('X.com Image Blackout extension loaded');
})();
