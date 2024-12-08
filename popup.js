document.addEventListener('DOMContentLoaded', function() {
    // Get all input elements
    const primarySrtFile = document.getElementById('primarySrtFile');
    const secondarySrtFile = document.getElementById('secondarySrtFile');
    const loadButton = document.getElementById('loadButton');
    const status = document.getElementById('status');

    // Primary subtitle settings
    const primaryTextColor = document.getElementById('primaryTextColor');
    const primaryFontSize = document.getElementById('primaryFontSize');
    const primaryFontSizeValue = document.getElementById('primaryFontSizeValue');
    const primaryPreviewText = document.getElementById('primaryPreviewText');

    // Secondary subtitle settings
    const secondaryTextColor = document.getElementById('secondaryTextColor');
    const secondaryFontSize = document.getElementById('secondaryFontSize');
    const secondaryFontSizeValue = document.getElementById('secondaryFontSizeValue');
    const secondaryPreviewText = document.getElementById('secondaryPreviewText');

    // Common settings
    const bgOpacity = document.getElementById('bgOpacity');
    const lineSpacing = document.getElementById('lineSpacing');
    const bgOpacityValue = document.getElementById('bgOpacityValue');
    const lineSpacingValue = document.getElementById('lineSpacingValue');

    // Display mode
    const displayMode = document.getElementById('displayMode');

    // Load saved settings
    chrome.storage.sync.get({
        primaryTextColor: '#ffffff',
        primaryFontSize: '20',
        secondaryTextColor: '#ffff00',
        secondaryFontSize: '20',
        bgOpacity: '80',
        lineSpacing: '1.6',
        displayMode: 'both'
    }, function(items) {
        primaryTextColor.value = items.primaryTextColor;
        primaryFontSize.value = items.primaryFontSize;
        secondaryTextColor.value = items.secondaryTextColor;
        secondaryFontSize.value = items.secondaryFontSize;
        bgOpacity.value = items.bgOpacity;
        lineSpacing.value = items.lineSpacing;
        displayMode.value = items.displayMode;
        updatePreviews();
    });

    // Update preview text when settings change
    function updatePreviews() {
        const opacity = bgOpacity.value / 100;
        const bgColor = `rgba(0, 0, 0, ${opacity})`;

        // Update primary preview
        primaryPreviewText.style.color = primaryTextColor.value;
        primaryPreviewText.style.fontSize = primaryFontSize.value + 'px';
        primaryPreviewText.style.backgroundColor = bgColor;
        primaryPreviewText.style.lineHeight = lineSpacing.value;
        primaryFontSizeValue.textContent = primaryFontSize.value;

        // Update secondary preview
        secondaryPreviewText.style.color = secondaryTextColor.value;
        secondaryPreviewText.style.fontSize = secondaryFontSize.value + 'px';
        secondaryPreviewText.style.backgroundColor = bgColor;
        secondaryPreviewText.style.lineHeight = lineSpacing.value;
        secondaryFontSizeValue.textContent = secondaryFontSize.value;

        // Update common values
        bgOpacityValue.textContent = bgOpacity.value;
        lineSpacingValue.textContent = lineSpacing.value;
    }

    // Save settings and update preview
    function saveSettings() {
        const settings = {
            primaryTextColor: primaryTextColor.value,
            primaryFontSize: primaryFontSize.value,
            secondaryTextColor: secondaryTextColor.value,
            secondaryFontSize: secondaryFontSize.value,
            bgOpacity: bgOpacity.value,
            lineSpacing: lineSpacing.value,
            displayMode: displayMode.value
        };

        chrome.storage.sync.set(settings, function() {
            updatePreviews();
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
    primaryTextColor.addEventListener('change', saveSettings);
    primaryFontSize.addEventListener('input', saveSettings);
    secondaryTextColor.addEventListener('change', saveSettings);
    secondaryFontSize.addEventListener('input', saveSettings);
    bgOpacity.addEventListener('input', saveSettings);
    lineSpacing.addEventListener('input', saveSettings);
    displayMode.addEventListener('change', saveSettings);

    loadButton.addEventListener('click', async function() {
        const primaryFile = primarySrtFile.files[0];
        const secondaryFile = secondarySrtFile.files[0];

        if (!primaryFile && !secondaryFile) {
            status.textContent = 'Please select at least one SRT file';
            return;
        }

        try {
            const subtitles = {
                primary: primaryFile ? await readFile(primaryFile) : null,
                secondary: secondaryFile ? await readFile(secondaryFile) : null
            };

            // Send the SRT content and current settings to the content script
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'loadSubtitles',
                    subtitles: subtitles,
                    settings: {
                        primaryTextColor: primaryTextColor.value,
                        primaryFontSize: primaryFontSize.value,
                        secondaryTextColor: secondaryTextColor.value,
                        secondaryFontSize: secondaryFontSize.value,
                        bgOpacity: bgOpacity.value,
                        lineSpacing: lineSpacing.value,
                        displayMode: displayMode.value
                    }
                });
                status.textContent = 'Subtitles loaded successfully!';
            });
        } catch (error) {
            status.textContent = 'Error loading subtitles: ' + error.message;
        }
    });

    // Initialize preview
    updatePreviews();
});

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}
