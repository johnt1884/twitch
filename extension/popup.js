document.addEventListener('DOMContentLoaded', () => {
    const muteTabCheckbox = document.getElementById('muteTab');
    const mutePlayerCheckbox = document.getElementById('mutePlayer');

    // Load saved settings
    chrome.storage.sync.get(['muteTab', 'mutePlayer'], (result) => {
        muteTabCheckbox.checked = !!result.muteTab;
        mutePlayerCheckbox.checked = !!result.mutePlayer;
    });

    // Save settings on change
    muteTabCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ muteTab: muteTabCheckbox.checked });
    });

    mutePlayerCheckbox.addEventListener('change', () => {
        chrome.storage.sync.set({ mutePlayer: mutePlayerCheckbox.checked });
    });
});
