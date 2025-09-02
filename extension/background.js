chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'setTabMuted') {
        chrome.tabs.update(sender.tab.id, { muted: request.muted });
    }
});
