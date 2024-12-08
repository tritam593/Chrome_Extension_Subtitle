let primarySubtitles = [];
let secondarySubtitles = [];
let subtitleContainer = null;
let videoElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let position = { x: 50, y: 90 };
let settings = {
    primaryTextColor: '#ffffff',
    primaryFontSize: '20',
    secondaryTextColor: '#ffff00',
    secondaryFontSize: '20',
    bgOpacity: '80',
    lineSpacing: '1.6',
    displayMode: 'both'
};

// Apply subtitle settings
function applySubtitleSettings() {
    if (!subtitleContainer) return;
    
    const opacity = parseInt(settings.bgOpacity) / 100;
    subtitleContainer.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    subtitleContainer.style.lineHeight = settings.lineSpacing;

    // Style primary and secondary subtitle spans
    const primarySpans = subtitleContainer.getElementsByClassName('primary-subtitle');
    const secondarySpans = subtitleContainer.getElementsByClassName('secondary-subtitle');

    for (let span of primarySpans) {
        span.style.color = settings.primaryTextColor;
        span.style.fontSize = `${settings.primaryFontSize}px`;
    }

    for (let span of secondarySpans) {
        span.style.color = settings.secondaryTextColor;
        span.style.fontSize = `${settings.secondaryFontSize}px`;
    }

    // Add padding based on larger font size
    const maxFontSize = Math.max(parseInt(settings.primaryFontSize), parseInt(settings.secondaryFontSize));
    const horizontalPadding = maxFontSize * 1.5;
    const verticalPadding = maxFontSize * 0.5;
    subtitleContainer.style.padding = `${verticalPadding}px ${horizontalPadding}px`;

    // Set width constraints
    const videoRect = videoElement.getBoundingClientRect();
    const minWidth = Math.min(videoRect.width * 0.3, 200);
    const maxWidth = videoRect.width * 0.8;
    subtitleContainer.style.minWidth = `${minWidth}px`;
    subtitleContainer.style.maxWidth = `${maxWidth}px`;
    subtitleContainer.style.width = 'auto';
    subtitleContainer.style.height = 'auto';
}

// Create subtitle container
function createSubtitleContainer() {
    if (subtitleContainer) {
        subtitleContainer.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'srt-subtitle-wrapper';
    
    subtitleContainer = document.createElement('div');
    subtitleContainer.className = 'srt-subtitle-container';
    wrapper.appendChild(subtitleContainer);
    
    const videoRect = videoElement.getBoundingClientRect();
    wrapper.style.position = 'absolute';
    wrapper.style.width = videoRect.width + 'px';
    wrapper.style.height = videoRect.height + 'px';
    wrapper.style.left = videoRect.left + 'px';
    wrapper.style.top = videoRect.top + 'px';
    
    videoElement.parentNode.insertBefore(wrapper, videoElement.nextSibling);
    
    // Make subtitle draggable
    subtitleContainer.addEventListener('mousedown', startDragging);
    
    // Set initial position
    setSubtitlePosition(position.x, position.y);
    
    // Apply initial settings
    applySubtitleSettings();

    // Create ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
        setSubtitlePosition(position.x, position.y);
    });

    resizeObserver.observe(subtitleContainer);
    
    // Update container position when window is resized
    window.addEventListener('resize', () => {
        const newRect = videoElement.getBoundingClientRect();
        wrapper.style.width = newRect.width + 'px';
        wrapper.style.height = newRect.height + 'px';
        wrapper.style.left = newRect.left + 'px';
        wrapper.style.top = newRect.top + 'px';
        applySubtitleSettings();
    });
}

// Start dragging
function startDragging(e) {
    if (!subtitleContainer) return;
    
    isDragging = true;
    
    const rect = subtitleContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - (rect.left + rect.width / 2);
    dragOffset.y = e.clientY - (rect.top + rect.height / 2);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    
    e.preventDefault();
}

// Handle dragging
function drag(e) {
    if (!isDragging || !videoElement) return;

    const videoRect = videoElement.getBoundingClientRect();

    // Calculate new position relative to video
    const x = ((e.clientX - dragOffset.x - videoRect.left) / videoRect.width) * 100;
    const y = ((e.clientY - dragOffset.y - videoRect.top) / videoRect.height) * 100;

    // Update position with bounds checking
    position.x = Math.max(0, Math.min(100, x));
    position.y = Math.max(0, Math.min(100, y));

    setSubtitlePosition(position.x, position.y);
}

function stopDragging() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
}

// Set subtitle position
function setSubtitlePosition(x, y) {
    if (!subtitleContainer) return;
    subtitleContainer.style.left = x + '%';
    subtitleContainer.style.top = y + '%';
}

// Update subtitles
function updateSubtitles(currentTime) {
    if (!subtitleContainer) return;
    
    const timeInMs = currentTime * 1000;
    const primarySubtitle = primarySubtitles.find(sub => 
        timeInMs >= sub.start && timeInMs <= sub.end
    );
    const secondarySubtitle = secondarySubtitles.find(sub => 
        timeInMs >= sub.start && timeInMs <= sub.end
    );

    let hasContent = false;
    let html = '';

    // Add primary subtitle if it should be shown
    if (primarySubtitle && (settings.displayMode === 'both' || settings.displayMode === 'primary')) {
        hasContent = true;
        const primaryText = parseFloat(settings.lineSpacing) === 0 
            ? primarySubtitle.text.replace(/\n/g, ' ')
            : primarySubtitle.text;
        html += `<div class="primary-subtitle subtitle-line">${primaryText}</div>`;
    }

    // Add secondary subtitle if it should be shown
    if (secondarySubtitle && (settings.displayMode === 'both' || settings.displayMode === 'secondary')) {
        hasContent = true;
        const secondaryText = parseFloat(settings.lineSpacing) === 0 
            ? secondarySubtitle.text.replace(/\n/g, ' ')
            : secondarySubtitle.text;
        html += `<div class="secondary-subtitle subtitle-line">${secondaryText}</div>`;
    }

    if (hasContent && settings.displayMode !== 'none') {
        subtitleContainer.innerHTML = html;
        subtitleContainer.style.display = 'block';
        applySubtitleSettings();
    } else {
        subtitleContainer.style.display = 'none';
    }
}

// Initialize subtitles
function initializeSubtitles() {
    if (!videoElement) {
        videoElement = findVideoElement();
    }
    
    if (!videoElement) {
        console.error('No video element found');
        return;
    }

    // Create container if needed
    if ((primarySubtitles.length > 0 || secondarySubtitles.length > 0) && !subtitleContainer) {
        createSubtitleContainer();
    }

    // Update subtitles on time update
    videoElement.addEventListener('timeupdate', function() {
        updateSubtitles(this.currentTime);
    });
}

// Find the main video element
function findVideoElement() {
    // Try regular DOM first
    const videos = document.getElementsByTagName('video');
    console.log('Found videos in regular DOM:', videos.length);
    
    if (videos.length > 0) {
        return videos[0];
    }

    // Try querySelector for broader search
    const videoQuery = document.querySelector('video');
    if (videoQuery) {
        console.log('Found video with querySelector');
        return videoQuery;
    }

    // Try searching in Shadow DOM
    const getAllShadowRoots = (root) => {
        const elements = root.querySelectorAll('*');
        const shadowRoots = [...elements]
            .map(el => el.shadowRoot)
            .filter(Boolean);
        return shadowRoots;
    };

    const shadowRoots = getAllShadowRoots(document);
    console.log('Found shadow roots:', shadowRoots.length);
    
    for (const shadowRoot of shadowRoots) {
        const shadowVideos = shadowRoot.querySelectorAll('video');
        if (shadowVideos.length > 0) {
            console.log('Found video in shadow DOM');
            return shadowVideos[0];
        }
    }

    // If still not found, try with iframe content
    const iframes = document.getElementsByTagName('iframe');
    console.log('Found iframes:', iframes.length);
    
    for (const iframe of iframes) {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeVideos = iframeDoc.getElementsByTagName('video');
            if (iframeVideos.length > 0) {
                console.log('Found video in iframe');
                return iframeVideos[0];
            }
        } catch (e) {
            console.log('Could not access iframe content:', e);
        }
    }

    console.log('No video element found in any context');
    return null;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'loadSubtitles') {
        try {
            if (request.subtitles.primary) {
                primarySubtitles = SRTParser.parse(request.subtitles.primary);
            }
            if (request.subtitles.secondary) {
                secondarySubtitles = SRTParser.parse(request.subtitles.secondary);
            }
            settings = request.settings;
            initializeSubtitles();
            sendResponse({status: 'success'});
        } catch (error) {
            console.error('Error parsing subtitles:', error);
            sendResponse({status: 'error', message: error.message});
        }
        return true;
    }
    
    if (request.action === 'updateSettings') {
        settings = request.settings;
        if (subtitleContainer) {
            applySubtitleSettings();
        }
        sendResponse({status: 'success'});
        return true;
    }
});
