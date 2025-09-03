// ==UserScript==
// @name         Twitch Followed Channels Enhancer (Robust Expansion & Visibility)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enhances the Twitch followed channels list
// @author       You
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const observerConfig = { childList: true, subtree: true };
    let offlineChannelsVisible = false;

    let currentOnlineCount = 0;
    let currentOfflineCount = 0;
    let processingLock = false;

    // Function to update the channel counts in the header
    function updateChannelCounts(followedChannelsContainer) {
        const headerTextElement = followedChannelsContainer.querySelector('[data-a-target="side-nav-header-expanded"] h3.CoreText-sc-1txzju1-0');
        const channelListElement = followedChannelsContainer.querySelector('.InjectLayout-sc-1i43xsx-0.cpWPwm');

        if (headerTextElement && channelListElement) {
            let online = 0;
            let offline = 0;

            channelListElement.querySelectorAll('.side-nav-card').forEach(card => {
                const isOfflineStatus = card.querySelector('[data-a-target="side-nav-live-status"]') &&
                                        card.querySelector('[data-a-target="side-nav-live-status"]').textContent.includes('Offline');
                if (isOfflineStatus) {
                    offline++;
                } else {
                    online++;
                }
            });

            if (online !== currentOnlineCount || offline !== currentOfflineCount) {
                currentOnlineCount = online;
                currentOfflineCount = offline;

                const originalHeaderText = "Followed Channels";
                headerTextElement.textContent = `${originalHeaderText} (${currentOnlineCount}/${currentOfflineCount})`;
            }
        }
    }

    // Function to click the "Show More" button if it exists, to load all channels
    function clickShowMoreIfPresent(container) {
        const showMoreButton = container.querySelector('[data-a-target="side-nav-show-more-button"]');
        if (showMoreButton && showMoreButton.offsetParent !== null) {
            showMoreButton.click();
            return true;
        }
        return false;
    }

    // Function to apply visibility rules (hide offline or show all)
    function applyChannelVisibility(channelListElement) {
        if (channelListElement) {
            if (offlineChannelsVisible) {
                showAllChannels(channelListElement);
            } else {
                hideOfflineChannels(channelListElement);
            }
        }
    }

    // Function to hide offline channels
    function hideOfflineChannels(channelListElement) {
        if (channelListElement) {
            channelListElement.querySelectorAll('.side-nav-card').forEach(card => {
                const isOfflineStatus = card.querySelector('[data-a-target="side-nav-live-status"]') &&
                                        card.querySelector('[data-a-target="side-nav-live-status"]').textContent.includes('Offline');

                if (isOfflineStatus) {
                    card.style.display = 'none';
                } else {
                    card.style.display = '';
                }
            });
        }
    }

    // Function to show all channels (online and offline)
    function showAllChannels(channelListElement) {
        if (channelListElement) {
            channelListElement.querySelectorAll('.side-nav-card').forEach(card => {
                card.style.display = '';
            });
        }
    }

    // Function to replace the "Show More" button with a toggle for offline channels
    function replaceShowMoreButton(followedChannelsContainer) {
        if (!followedChannelsContainer) return;

        const showMoreButtonContainer = followedChannelsContainer.querySelector('.side-nav-show-more-toggle__button');
        if (showMoreButtonContainer) {
            let newButton = document.getElementById('toggleOfflineChannelsButton');
            if (!newButton) {
                showMoreButtonContainer.innerHTML = '';

                newButton = document.createElement('button');
                newButton.className = 'ScCoreLink-sc-16kq0mq-0 bmaSLQ tw-link';
                newButton.style.marginTop = '10px';
                newButton.style.width = '100%';
                newButton.id = 'toggleOfflineChannelsButton';

                newButton.addEventListener('click', () => {
                    const channelListElement = followedChannelsContainer.querySelector('.InjectLayout-sc-1i43xsx-0.cpWPwm');
                    if (channelListElement) {
                        offlineChannelsVisible = !offlineChannelsVisible;
                        applyChannelVisibility(channelListElement);
                        newButton.textContent = offlineChannelsVisible ? 'Hide Offline Channels' : 'Show Offline Channels';
                    }
                });
                showMoreButtonContainer.appendChild(newButton);
            }
            newButton.textContent = offlineChannelsVisible ? 'Hide Offline Channels' : 'Show Offline Channels';
        }
    }

    // Main function to process the followed channels list
    function processFollowedChannels() {
        const followedChannelsContainer = document.querySelector('[aria-label="Followed Channels"]');

        if (followedChannelsContainer && !followedChannelsContainer.dataset.processed) {
            followedChannelsContainer.dataset.processed = 'true';
            console.log("Processing followed channels container for the first time.");

            const showLessPara = followedChannelsContainer.querySelector('.followed-side-nav-header p.CoreText-sc-1txzju1-0.jPfhdt');
            if (showLessPara) {
                showLessPara.remove();
            }

            let expansionAttempts = 0;
            const maxExpansionAttempts = 100;
            const expansionInterval = 50;
            let previousChannelCount = 0;

            const exhaustivelyExpandChannels = setInterval(() => {
                const clicked = clickShowMoreIfPresent(followedChannelsContainer);
                const currentChannelCount = followedChannelsContainer.querySelectorAll('.side-nav-card').length;
                const showMoreButton = followedChannelsContainer.querySelector('[data-a-target="side-nav-show-more-button"]');

                if (currentChannelCount > previousChannelCount) {
                    previousChannelCount = currentChannelCount;
                    expansionAttempts = 0;
                } else if (!showMoreButton || showMoreButton.offsetParent === null) {
                    clearInterval(exhaustivelyExpandChannels);
                    console.log(`Finished exhaustive expansion. Total channels found: ${currentChannelCount}.`);
                    finalizeChannelProcessing(followedChannelsContainer);
                } else if (expansionAttempts >= maxExpansionAttempts) {
                    clearInterval(exhaustivelyExpandChannels);
                    console.warn(`Max expansion attempts (${maxExpansionAttempts}) reached. Could not load all channels.`);
                    finalizeChannelProcessing(followedChannelsContainer);
                }
                expansionAttempts++;
            }, expansionInterval);
        }
    }

    // Function to run once all channels are presumed to be loaded
    function finalizeChannelProcessing(followedChannelsContainer) {
        if (!followedChannelsContainer) return;

        const channelListElement = followedChannelsContainer.querySelector('.InjectLayout-sc-1i43xsx-0.cpWPwm');
        if (channelListElement) {
            updateChannelCounts(followedChannelsContainer);
            applyChannelVisibility(channelListElement);
            replaceShowMoreButton(followedChannelsContainer);

            new MutationObserver((mutations, innerObserver) => {
                if (processingLock) return;
                processingLock = true;

                setTimeout(() => {
                    updateChannelCounts(followedChannelsContainer);
                    applyChannelVisibility(channelListElement);
                    replaceShowMoreButton(followedChannelsContainer);
                    processingLock = false;
                }, 50);
            }).observe(channelListElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['title', 'class'] });
            console.log("Observing channel list for dynamic updates and count recalculation.");
        }
    }

    // --- Open Stories Repositioning ---
    const moveOpenStoriesToTop = () => {
        const storiesSelector = '.storiesLeftNavSection--csO9S';
        const storiesSection = document.querySelector(storiesSelector);

        if (storiesSection) {
            const parentContainer = storiesSection.parentNode;
            if (parentContainer && parentContainer.firstChild !== storiesSection) {
                parentContainer.insertBefore(storiesSection, parentContainer.firstChild);
                console.log("Moved 'Open Stories' to the top of the sidebar.");
            }
        }
    };
    // --- End Open Stories Repositioning ---

    // --- Cog Icon Repositioning Logic: After "For You" text ---
    function addStyle(css) {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(css));
        document.head.appendChild(style);
    }

    // Inject styles for the new cog icon placement
    addStyle(`
        .for-you-heading-with-cog {
            display: flex;
            align-items: center;
            gap: 8px; /* Space between "For You" text and cog */
        }
        .userscript-cog-button {
            background: none;
            border: medium;
            padding: 0;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 20px; /* Adjust size as needed */
            height: 20px; /* Adjust size as needed */
            color: var(--color-text-alt); /* Match Twitch's default icon color */
        }
        .userscript-cog-button:hover {
            color: var(--color-text-link); /* Hover effect */
        }
        /* Ensure the SVG scales within the button */
        .userscript-cog-button svg {
            width: 100%;
            height: 100%;
            fill: currentColor; /* Use parent's color */
        }
    `);

    const placeCogIconAfterForYou = () => {
        // Find the "For You" heading. Twitch often uses an h3 or h4, and can be within a specific container.
        // This selector might need adjustment based on the exact structure of your Twitch page.
        // We'll look for an h3 or h4 that contains "For You" text.
        const forYouHeading = Array.from(document.querySelectorAll('h3, h4')).find(
            el => el.textContent.trim() === 'For You' && el.offsetParent !== null
        );

        if (!forYouHeading || forYouHeading.dataset.cogAdded) {
            // console.log("For You heading not found or cog already added."); // Uncomment for debugging
            return;
        }

        // Create the cog icon HTML structure
        const cogIconHtml = `
            <button class="userscript-cog-button" aria-label="Userscript Settings" title="Userscript Settings">
                <svg width="20" height="20" viewBox="0 0 20 20" focusable="false" aria-hidden="true" role="presentation">
                    <path fill-rule="evenodd" d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12zM9 9h2v4H9V9zm-2.83-2.83a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L6.173 7.877a.5.5 0 0 1 0-.707zM14.17 6.173a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zM12 9a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 12 9zM6 10a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 6 10z" clip-rule="evenodd"></path>
                </svg>
            </button>
        `;

        // Create a wrapper div to hold "For You" and the cog icon for flex alignment
        const wrapper = document.createElement('div');
        wrapper.className = 'for-you-heading-with-cog';

        // Move the original "For You" heading into the wrapper
        forYouHeading.parentNode.insertBefore(wrapper, forYouHeading);
        wrapper.appendChild(forYouHeading);

        // Insert the cog icon after the "For You" heading within the wrapper
        wrapper.insertAdjacentHTML('beforeend', cogIconHtml);

        // Mark the heading so we don't add the cog multiple times
        forYouHeading.dataset.cogAdded = 'true';
        console.log("Cog icon placed after 'For You' text.");

        // Optional: Add an event listener to the cog icon if it should do something
        const newCogButton = wrapper.querySelector('.userscript-cog-button');
        if (newCogButton) {
            newCogButton.addEventListener('click', () => {
                alert('Userscript settings opened!'); // Replace with actual functionality
                // Example: You could trigger a Tampermonkey menu item or open a small modal
            });
        }
    };
    // --- End Cog Icon Repositioning Logic ---


    // Use a MutationObserver to detect when the followed channels list and other elements are added to the DOM
    const globalObserver = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const followedChannelsContainer = document.querySelector('[aria-label="Followed Channels"]');
                if (followedChannelsContainer && !followedChannelsContainer.dataset.processed) {
                    processFollowedChannels();
                }

                // Attempt to place the cog icon next to "For You"
                // We'll call this repeatedly as the "For You" section might load dynamically
                placeCogIconAfterForYou();
                moveOpenStoriesToTop();
            }
        }
    });

    // Start observing the document body for changes
    globalObserver.observe(document.body, observerConfig);

    // Initial checks in case the elements are already present on page load
    processFollowedChannels();
    placeCogIconAfterForYou();
    moveOpenStoriesToTop();

})();
