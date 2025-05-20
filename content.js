(function () {
    // Variables
    let progressBar, percentageLabel;
    let isBarCreated = false;
    let settings = {
        theme: 'solid',
        barColor: '#6e56cf',
        barBgColor: '#333333',
        barHeight: 5,
        barPosition: 'top',
        showPercentage: true,
        smoothScroll: false
    };

    // Get settings and initialize progress bar
    browser.storage.local.get(settings, function (items) {
        settings = items;
        createProgressBar();

        if (settings.smoothScroll) {
            enableSmoothScrolling();
        }
    });

    // Listen for messages from popup
    browser.runtime.onMessage.addListener(function (message) {
        if (message.action === 'updateProgressBar') {
            settings = message.settings;

            if (!isBarCreated) {
                createProgressBar();
            } else {
                updateProgressBarStyle();
            }

            if (settings.smoothScroll) {
                enableSmoothScrolling();
            } else {
                // Disable smooth scrolling if setting is turned off
                document.documentElement.style.scrollBehavior = 'auto';
            }
        }
    });

    // Function to create the progress bar
    function createProgressBar() {
        if (isBarCreated) return;

        // Create container
        progressBar = document.createElement('div');
        progressBar.id = 'reading-progress-bar-container';

        // Create fill element
        const progressBarFill = document.createElement('div');
        progressBarFill.id = 'reading-progress-bar-fill';
        progressBar.appendChild(progressBarFill);

        // Create percentage label if needed
        if (settings.showPercentage) {
            percentageLabel = document.createElement('div');
            percentageLabel.id = 'reading-progress-percentage';
            progressBar.appendChild(percentageLabel);
        }

        // Apply initial styles
        updateProgressBarStyle();

        // Add to DOM
        document.body.appendChild(progressBar);
        isBarCreated = true;

        // Initial update and add scroll listener
        updateProgressBarValue();
        window.addEventListener('scroll', updateProgressBarValue, { passive: true });
        window.addEventListener('resize', updateProgressBarValue, { passive: true });
    }

    // Update progress bar style based on settings
    function updateProgressBarStyle() {
        if (!progressBar) return;

        // Container styles
        const containerCSS = {
            position: 'fixed',
            left: '0',
            width: '100%',
            height: `${settings.barHeight}px`,
            backgroundColor: settings.barBgColor,
            zIndex: '9999',
            transition: 'opacity 0.3s ease',
            opacity: '0.8'
        };

        // Clear previous position styles
        progressBar.style.top = '';
        progressBar.style.bottom = '';

        // Set position (top or bottom)
        if (settings.barPosition === 'top') {
            containerCSS.top = '0';
        } else {
            containerCSS.bottom = '0';
        }

        // Apply container styles
        Object.assign(progressBar.style, containerCSS);

        // Get the fill element
        const fill = progressBar.querySelector('#reading-progress-bar-fill');
        if (!fill) return;

        // Base fill styles
        const fillCSS = {
            height: '100%',
            width: '0%',
            transition: 'width 0.1s ease-out'
        };

        // Always use the user's selected color
        fillCSS.backgroundColor = settings.barColor;

        // Apply theme-specific styles
        switch (settings.theme) {
            case 'solid':
                // Already set the basic background color above
                break;

            case 'gradient':
                fillCSS.background = `linear-gradient(to right, ${settings.barColor}, ${adjustBrightness(settings.barColor, 50)})`;
                break;

            case 'pulse':
                // Create and add the animation style if not already added
                if (!document.getElementById('reading-progress-pulse-animation')) {
                    const style = document.createElement('style');
                    style.id = 'reading-progress-pulse-animation';
                    style.textContent = `
              @keyframes pulseReadingBar {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `;
                    document.head.appendChild(style);
                }
                fillCSS.animation = 'pulseReadingBar 2s infinite';
                break;

            case 'glow':
                fillCSS.boxShadow = `0 0 10px ${settings.barColor}`;
                break;

            case 'striped':
                // Use a more reliable striped pattern implementation
                fillCSS.backgroundImage = `linear-gradient(
            45deg,
            ${settings.barColor} 25%,
            ${adjustBrightness(settings.barColor, 20)} 25%,
            ${adjustBrightness(settings.barColor, 20)} 50%,
            ${settings.barColor} 50%,
            ${settings.barColor} 75%,
            ${adjustBrightness(settings.barColor, 20)} 75%,
            ${adjustBrightness(settings.barColor, 20)}
          )`;
                fillCSS.backgroundSize = '20px 20px';
                break;
        }

        // Apply fill styles
        Object.assign(fill.style, fillCSS);

        // Update percentage label if enabled
        if (settings.showPercentage) {
            if (!percentageLabel) {
                percentageLabel = document.createElement('div');
                percentageLabel.id = 'reading-progress-percentage';
                progressBar.appendChild(percentageLabel);
            }

            Object.assign(percentageLabel.style, {
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: `${Math.max(10, settings.barHeight * 1.5)}px`,
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                zIndex: '10000',
                pointerEvents: 'none'
            });
        } else if (percentageLabel) {
            percentageLabel.remove();
            percentageLabel = null;
        }
    }

    // Update progress bar value on scroll
    function updateProgressBarValue() {
        if (!progressBar) return;

        const fill = progressBar.querySelector('#reading-progress-bar-fill');
        if (!fill) return;

        // Calculate scroll progress
        const windowHeight = window.innerHeight;
        const documentHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const totalScrollable = documentHeight - windowHeight;

        let progress = 0;
        if (totalScrollable > 0) {
            progress = (scrollTop / totalScrollable) * 100;
        }

        // Apply progress
        fill.style.width = `${progress}%`;

        // Update percentage label if enabled
        if (percentageLabel) {
            percentageLabel.textContent = `${Math.round(progress)}%`;
        }
    }

    // Enable smooth scrolling if selected
    function enableSmoothScrolling() {
        document.documentElement.style.scrollBehavior = 'smooth';
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
})();