let subtitles = [];
let subtitleElement = null;
let videoElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let subtitlePosition = { x: 50, y: 90 };
let subtitleSettings = {
    textColor: '#ffffff',
    fontSize: '20',
    bgOpacity: '80',
    lineSpacing: '1.6'
};

// Apply subtitle settings
function applySubtitleSettings() {
    if (!subtitleElement) return;
    
    const opacity = parseInt(subtitleSettings.bgOpacity) / 100;
    subtitleElement.style.color = subtitleSettings.textColor;
    subtitleElement.style.fontSize = `${subtitleSettings.fontSize}px`;
    subtitleElement.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    subtitleElement.style.lineHeight = subtitleSettings.lineSpacing;

    // Create a temporary span to measure text
    const tempSpan = document.createElement('span');
    tempSpan.style.fontSize = `${subtitleSettings.fontSize}px`;
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.whiteSpace = 'pre-line';
    tempSpan.style.lineHeight = subtitleSettings.lineSpacing;
    tempSpan.textContent = subtitleElement.textContent;
    document.body.appendChild(tempSpan);

    // Get the actual text size
    const textWidth = tempSpan.offsetWidth;
    const textHeight = tempSpan.offsetHeight;

    // Remove the temporary span
    tempSpan.remove();

    // Add padding to the measurements
    const horizontalPadding = parseInt(subtitleSettings.fontSize) * 1.5;
    const verticalPadding = parseInt(subtitleSettings.fontSize) * 0.5;

    // Set minimum width based on video size
    const videoRect = videoElement.getBoundingClientRect();
    const minWidth = Math.min(videoRect.width * 0.3, 200); // At least 30% of video width or 200px
    const maxWidth = videoRect.width * 0.8; // 80% of video width

    // Apply the new size
    subtitleElement.style.minWidth = `${minWidth}px`;
    subtitleElement.style.maxWidth = `${maxWidth}px`;
    subtitleElement.style.width = 'auto';
    subtitleElement.style.height = 'auto';
    subtitleElement.style.padding = `${verticalPadding}px ${horizontalPadding}px`;
}

// Create subtitle container
function createSubtitleContainer() {
    if (subtitleElement) {
        subtitleElement.remove();
    }

    // Create a container for subtitles that will be positioned over the video
    const container = document.createElement('div');
    container.className = 'srt-subtitle-wrapper';
    
    subtitleElement = document.createElement('div');
    subtitleElement.className = 'srt-subtitle-container';
    container.appendChild(subtitleElement);
    
    // Position the container over the video
    const videoRect = videoElement.getBoundingClientRect();
    container.style.position = 'absolute';
    container.style.width = videoRect.width + 'px';
    container.style.height = videoRect.height + 'px';
    container.style.left = videoRect.left + 'px';
    container.style.top = videoRect.top + 'px';
    
    // Insert the container right after the video
    videoElement.parentNode.insertBefore(container, videoElement.nextSibling);
    
    // Make subtitle draggable
    subtitleElement.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);
    
    // Set initial position
    setSubtitlePosition(subtitlePosition.x, subtitlePosition.y);
    
    // Apply initial settings
    applySubtitleSettings();

    // Create ResizeObserver for the subtitle element
    const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
            const { width, height } = entry.contentRect;
            // Adjust the position to maintain centering after size change
            setSubtitlePosition(subtitlePosition.x, subtitlePosition.y);
        }
    });

    // Observe the subtitle element
    resizeObserver.observe(subtitleElement);
    
    // Update container position when window is resized
    window.addEventListener('resize', () => {
        const newRect = videoElement.getBoundingClientRect();
        container.style.width = newRect.width + 'px';
        container.style.height = newRect.height + 'px';
        container.style.left = newRect.left + 'px';
        container.style.top = newRect.top + 'px';
        applySubtitleSettings(); // Reapply settings to adjust for new video size
    });
}

function startDragging(e) {
    if (!subtitleElement) return;
    
    isDragging = true;
    
    // Get the subtitle element's bounding rectangle
    const rect = subtitleElement.getBoundingClientRect();
    
    // Calculate the offset from the click point to the element's center
    dragOffset.x = e.clientX - (rect.left + rect.width / 2);
    dragOffset.y = e.clientY - (rect.top + rect.height / 2);
    
    // Prevent text selection while dragging
    e.preventDefault();
}

function drag(e) {
    if (!isDragging || !subtitleElement || !videoElement) return;

    const videoRect = videoElement.getBoundingClientRect();
    const subtitleRect = subtitleElement.getBoundingClientRect();

    // Calculate new position relative to video
    const x = ((e.clientX - dragOffset.x - videoRect.left) / videoRect.width) * 100;
    const y = ((e.clientY - dragOffset.y - videoRect.top) / videoRect.height) * 100;

    // Update position with bounds checking
    subtitlePosition.x = Math.max(0, Math.min(100, x));
    subtitlePosition.y = Math.max(0, Math.min(100, y));

    setSubtitlePosition(subtitlePosition.x, subtitlePosition.y);
}

function stopDragging() {
    isDragging = false;
}

function setSubtitlePosition(xPercent, yPercent) {
    if (!subtitleElement) return;
    
    subtitlePosition.x = xPercent;
    subtitlePosition.y = yPercent;
    
    subtitleElement.style.left = `${xPercent}%`;
    subtitleElement.style.top = `${yPercent}%`;
}

// Find the main video element
function findVideoElement() {
    console.log('Searching for video element...');
    const videos = document.getElementsByTagName('video');
    if (videos.length > 0) {
        console.log('Video element found');
        videoElement = videos[0];
        
        // Add fullscreen change listener
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        
        return videoElement;
    }
    console.log('No video element found');
    return null;
}

function handleFullscreenChange() {
    const wrapper = document.querySelector('.srt-subtitle-wrapper');
    if (!wrapper) return;
    
    if (document.fullscreenElement || document.webkitFullscreenElement) {
        const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        wrapper.style.position = 'fixed';
        wrapper.style.left = '0';
        wrapper.style.top = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';
    } else {
        const videoRect = videoElement.getBoundingClientRect();
        wrapper.style.position = 'absolute';
        wrapper.style.width = videoRect.width + 'px';
        wrapper.style.height = videoRect.height + 'px';
        wrapper.style.left = videoRect.left + 'px';
        wrapper.style.top = videoRect.top + 'px';
    }
}

// Update subtitle display
function updateSubtitles(currentTime) {
    if (!subtitleElement) return;
    
    const timeInMs = currentTime * 1000;
    const currentSubtitle = subtitles.find(sub => 
        timeInMs >= sub.start && timeInMs <= sub.end
    );

    if (currentSubtitle) {
        // Process the text to ensure proper line breaks
        // When line spacing is 0, join lines with no breaks
        if (parseFloat(subtitleSettings.lineSpacing) === 0) {
            subtitleElement.textContent = currentSubtitle.text.replace(/\n/g, ' ');
        } else {
            const processedText = currentSubtitle.text
                .split('\n')
                .map(line => `<span class="subtitle-line">${line}</span>`)
                .join('\n');
            subtitleElement.innerHTML = processedText;
        }
        
        subtitleElement.style.display = 'block';
        applySubtitleSettings(); // Reapply settings for new text
    } else {
        subtitleElement.style.display = 'none';
    }
}

// Initialize subtitle display
function initializeSubtitles() {
    console.log('Initializing subtitles...');
    console.log('Number of subtitles loaded:', subtitles.length);
    
    videoElement = findVideoElement();
    if (!videoElement) {
        console.log('Retrying video element search...');
        setTimeout(initializeSubtitles, 1000);
        return;
    }
    
    createSubtitleContainer();
    
    console.log('Adding timeupdate listener to video');
    videoElement.addEventListener('timeupdate', () => {
        updateSubtitles(videoElement.currentTime);
    });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Received message:', request);
    
    // Check if content script is loaded
    if (request.type === 'CHECK_LOADED') {
        sendResponse({status: 'loaded'});
        return true;
    }
    
    // Handle settings update
    if (request.action === 'updateSettings') {
        subtitleSettings = request.settings;
        applySubtitleSettings();
        sendResponse({status: 'success'});
        return true;
    }
    
    // Handle subtitle loading
    if (request.action === 'loadSubtitles') {
        console.log('Loading subtitles...');
        try {
            // Update settings if provided
            if (request.settings) {
                subtitleSettings = request.settings;
            }
            
            subtitles = SRTParser.parse(request.content);
            console.log('Parsed subtitles:', subtitles);
            initializeSubtitles();
            sendResponse({status: 'success'});
        } catch (error) {
            console.error('Error parsing subtitles:', error);
            sendResponse({status: 'error', message: error.message});
        }
        return true;
    }
});
