document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('srtFile');
    const loadButton = document.getElementById('loadButton');
    const status = document.getElementById('status');
    const textColor = document.getElementById('textColor');
    const fontSize = document.getElementById('fontSize');
    const bgOpacity = document.getElementById('bgOpacity');
    const lineSpacing = document.getElementById('lineSpacing');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const bgOpacityValue = document.getElementById('bgOpacityValue');
    const lineSpacingValue = document.getElementById('lineSpacingValue');
    const previewText = document.getElementById('previewText');

    // Load saved settings
    chrome.storage.sync.get({
        textColor: '#ffffff',
        fontSize: '20',
        bgOpacity: '80',
        lineSpacing: '1.6'
    }, function(items) {
        textColor.value = items.textColor;
        fontSize.value = items.fontSize;
        bgOpacity.value = items.bgOpacity;
        lineSpacing.value = items.lineSpacing;
        updatePreview();
    });

    // Update preview text when settings change
    function updatePreview() {
        const opacity = bgOpacity.value / 100;
        previewText.style.color = textColor.value;
        previewText.style.fontSize = fontSize.value + 'px';
        previewText.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
        previewText.style.lineHeight = lineSpacing.value;
        fontSizeValue.textContent = fontSize.value;
        bgOpacityValue.textContent = bgOpacity.value;
        lineSpacingValue.textContent = lineSpacing.value;
    }

    // Save settings and update preview
    function saveSettings() {
        const settings = {
            textColor: textColor.value,
            fontSize: fontSize.value,
            bgOpacity: bgOpacity.value,
            lineSpacing: lineSpacing.value
        };

        chrome.storage.sync.set(settings, function() {
            updatePreview();
            // Send settings to content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateSettings',
                    settings: settings
                });
            });
        });
    }

    // Add event listeners for settings changes
    textColor.addEventListener('change', saveSettings);
    fontSize.addEventListener('input', saveSettings);
    bgOpacity.addEventListener('input', saveSettings);
    lineSpacing.addEventListener('input', saveSettings);

    loadButton.addEventListener('click', async function() {
        const file = fileInput.files[0];
        if (!file) {
            status.textContent = 'Please select an SRT file first';
            return;
        }

        try {
            const content = await readFile(file);
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // Inject content script if not already injected
            try {
                await chrome.tabs.sendMessage(tab.id, {type: 'CHECK_LOADED'});
            } catch (e) {
                // If content script is not loaded, reload the page
                await chrome.tabs.reload(tab.id);
                // Wait for page to load
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Send the SRT content and current settings to the content script
            await chrome.tabs.sendMessage(tab.id, {
                action: 'loadSubtitles',
                content: content,
                settings: {
                    textColor: textColor.value,
                    fontSize: fontSize.value,
                    bgOpacity: bgOpacity.value,
                    lineSpacing: lineSpacing.value
                }
            });
            
            status.textContent = 'Subtitles loaded successfully!';
        } catch (error) {
            status.textContent = 'Error: ' + error.message;
            console.error('Error:', error);
        }
    });

    // Initialize preview
    updatePreview();
});

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}
