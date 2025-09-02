const cogIconSVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.25 C14.38,2.01,14.17,1.82,13.92,1.82H9.92C9.67,1.82,9.46,2.01,9.44,2.25l-0.3,2.53c-0.59,0.24-1.12,0.56-1.62,0.94L5.13,4.76 C4.91,4.69,4.66,4.76,4.54,4.98L2.62,8.3C2.5,8.5,2.56,8.77,2.74,8.91l2.03,1.58C4.72,10.79,4.67,11.39,4.67,12 c0,0.61,0.05,1.21,0.14,1.78l-2.03,1.58c-0.18,0.14-0.24,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96 c0.5,0.38,1.03,0.7,1.62,0.94l0.3,2.53c0.02,0.24,0.23,0.43,0.48,0.43h4c0.25,0,0.46-0.19,0.48-0.43l0.3-2.53 c0.59-0.24,1.12-0.56,1.62-0.94l2.39,0.96c0.22,0.07,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M11.92,15.5c-1.93,0-3.5-1.57-3.5-3.5s1.57-3.5,3.5-3.5s3.5,1.57,3.5,3.5S13.85,15.5,11.92,15.5z" fill="currentColor"/>
</svg>
`;

function addCogIcon() {
    const primeButtonSelector = '#root > div > div.Layout-sc-1xcs6mc-0.hodpZn > nav > div > div.Layout-sc-1xcs6mc-0.bZYcrx > div.Layout-sc-1xcs6mc-0.VxLcr.top-nav__prime > div > div > div:nth-child(1) > div > div > button';
    const primeButton = document.querySelector(primeButtonSelector);

    if (primeButton && !document.querySelector('.twitch-refined-cog-button')) {
        const cogButton = document.createElement('button');
        cogButton.className = 'twitch-refined-cog-button';
        cogButton.innerHTML = cogIconSVG;
        cogButton.style.cssText = 'margin-right: 10px; background: none; border: none; cursor: pointer; color: white;';

        primeButton.parentElement.insertBefore(cogButton, primeButton);

        cogButton.addEventListener('click', () => {
            // In a real extension, this might open a settings modal,
            // but for now we'll rely on the popup.
        });

        return true;
    }
    return false;
}

function controlAudio() {
    chrome.storage.sync.get(['muteTab', 'mutePlayer'], (settings) => {
        // Control tab mute state
        // If the setting is not checked, we want to unmute the tab.
        const shouldMuteTab = settings.muteTab !== undefined ? settings.muteTab : false;
        chrome.runtime.sendMessage({ action: 'setTabMuted', muted: shouldMuteTab });

        // Control video player mute state
        const videoPlayer = document.querySelector('video');
        if (videoPlayer) {
            const shouldMutePlayer = settings.mutePlayer !== undefined ? settings.mutePlayer : false;
            videoPlayer.muted = shouldMutePlayer;
        }
    });
}

const iconInterval = setInterval(() => {
    if (addCogIcon()) {
        clearInterval(iconInterval);
    }
}, 1000);

const audioInterval = setInterval(() => {
    const videoPlayer = document.querySelector('video');
    if (videoPlayer) {
        controlAudio();
        clearInterval(audioInterval);
    }
}, 500);
