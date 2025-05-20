// This background script handles initialization and browser events

// Set default options when extension is installed
browser.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
        browser.storage.local.set({
            theme: 'solid',
            barColor: '#6e56cf',
            barBgColor: '#333333',
            barHeight: 5,
            barPosition: 'top',
            showPercentage: true,
            smoothScroll: false
        });
    }
});

// Listen for tab updates to reinject the progress bar if needed
browser.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.match(/^(http|https):/)) {
        browser.tabs.executeScript(tabId, {
            file: 'content.js'
        }).catch(err => {
            // Silently ignore errors for privileged pages
            console.log('Could not inject script: ', err);
        });
    }
});