document.addEventListener('DOMContentLoaded', function () {
    const themeSelect = document.getElementById('theme-select');
    const barHeight = document.getElementById('bar-height');
    const barPosition = document.getElementById('bar-position');
    const showPercentage = document.getElementById('show-percentage');
    const smoothScroll = document.getElementById('smooth-scroll');
    const saveButton = document.getElementById('save-settings');
    const previewBar = document.getElementById('preview-bar');
    const colorPalette = document.getElementById('color-palette');

    // Default settings
    let currentSettings = {
        theme: 'solid',
        barColor: '#6e56cf',
        barBgColor: '#333333',
        barHeight: 5,
        barPosition: 'top',
        showPercentage: true,
        smoothScroll: false
    };

    // Load saved settings
    browser.storage.local.get(currentSettings, function (items) {
        currentSettings = items;

        themeSelect.value = currentSettings.theme;
        barHeight.value = currentSettings.barHeight;
        barPosition.value = currentSettings.barPosition;
        showPercentage.checked = currentSettings.showPercentage;
        smoothScroll.checked = currentSettings.smoothScroll;

        // Select the color option matching saved settings
        selectColorOption(currentSettings.barColor, currentSettings.barBgColor);

        updatePreviewBar();
    });

    // Update preview when settings change
    themeSelect.addEventListener('change', updatePreviewBar);

    // Handle color palette clicks
    colorPalette.addEventListener('click', function (e) {
        if (e.target.classList.contains('color-option')) {
            // Remove selected class from all options
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });

            // Add selected class to clicked option
            e.target.classList.add('selected');

            // Update settings with selected colors
            currentSettings.barColor = e.target.dataset.color;
            currentSettings.barBgColor = e.target.dataset.bg;

            updatePreviewBar();
        }
    });

    // Select color option that matches the given colors
    function selectColorOption(barColor, barBgColor) {
        const options = document.querySelectorAll('.color-option');

        // Remove selected class from all options
        options.forEach(option => {
            option.classList.remove('selected');
        });

        // Find matching option
        let found = false;
        options.forEach(option => {
            if (option.dataset.color === barColor && option.dataset.bg === barBgColor) {
                option.classList.add('selected');
                found = true;
            }
        });

        // If no match found, select the first option
        if (!found && options.length > 0) {
            options[0].classList.add('selected');
            currentSettings.barColor = options[0].dataset.color;
            currentSettings.barBgColor = options[0].dataset.bg;
        }
    }

    // Update the preview bar style based on selected theme
    function updatePreviewBar() {
        const selectedTheme = themeSelect.value;
        const currentBarColor = currentSettings.barColor;

        // Reset previous styles
        previewBar.style = '';
        previewBar.style.width = '70%';

        switch (selectedTheme) {
            case 'solid':
                previewBar.style.backgroundColor = currentBarColor;
                break;

            case 'gradient':
                previewBar.style.background = `linear-gradient(to right, ${currentBarColor}, ${adjustBrightness(currentBarColor, 50)})`;
                break;

            case 'pulse':
                previewBar.style.backgroundColor = currentBarColor;
                previewBar.style.animation = 'pulse 2s infinite';

                // Only add the style if it doesn't already exist
                if (!document.getElementById('pulse-preview-style')) {
                    const style = document.createElement('style');
                    style.id = 'pulse-preview-style';
                    style.textContent = `
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `;
                    document.head.appendChild(style);
                }
                break;

            case 'glow':
                previewBar.style.backgroundColor = currentBarColor;
                previewBar.style.boxShadow = `0 0 10px ${currentBarColor}`;
                break;

            case 'striped':
                previewBar.style.backgroundImage = `linear-gradient(
            45deg,
            ${currentBarColor} 25%,
            ${adjustBrightness(currentBarColor, 20)} 25%,
            ${adjustBrightness(currentBarColor, 20)} 50%,
            ${currentBarColor} 50%,
            ${currentBarColor} 75%,
            ${adjustBrightness(currentBarColor, 20)} 75%,
            ${adjustBrightness(currentBarColor, 20)}
          )`;
                previewBar.style.backgroundSize = '20px 20px';
                break;
        }
    }

    // Helper function to adjust color brightness
    function adjustBrightness(hex, percent) {
        hex = hex.replace(/^\s*#|\s*$/g, '');

        // Convert 3 char to 6 char
        if (hex.length === 3) {
            hex = hex.replace(/(.)/g, '$1$1');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        const newR = Math.max(0, Math.min(255, r + percent));
        const newG = Math.max(0, Math.min(255, g + percent));
        const newB = Math.max(0, Math.min(255, b + percent));

        return "#" +
            ((1 << 24) + (newR << 16) + (newG << 8) + newB)
                .toString(16).slice(1);
    }

    // Save settings
    saveButton.addEventListener('click', function () {
        const settings = {
            theme: themeSelect.value,
            barColor: currentSettings.barColor,
            barBgColor: currentSettings.barBgColor,
            barHeight: parseInt(barHeight.value),
            barPosition: barPosition.value,
            showPercentage: showPercentage.checked,
            smoothScroll: smoothScroll.checked
        };

        browser.storage.local.set(settings, function () {
            // Send message to content script to update the progress bar
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                browser.tabs.sendMessage(tabs[0].id, {
                    action: 'updateProgressBar',
                    settings: settings
                });
            });

            // Give visual feedback
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
                saveButton.textContent = 'Save Settings';
            }, 1500);
        });
    });
});