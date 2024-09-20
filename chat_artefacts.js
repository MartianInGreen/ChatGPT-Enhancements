// ==UserScript==
// @name         ChatGPT Artefacts
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Claude-like Artefacts inside ChatGPT Code Blocks. Open in Side Panel or Open in New Tab.
// @match        https://chatgpt.com/*
// @grant        GM_addElement
// @grant        GM_addStyle
// @author       @MartianInGreen
// @license      MIT
// @run-at       document-end
// ==/UserScript==

// @attribution  https://gist.github.com/CurtisAccelerate/64a20b1d5df6240119bb0a3f4b5abf31
// Base of script made by https://github.com/CurtisAccelerate @ https://gist.github.com/CurtisAccelerate/64a20b1d5df6240119bb0a3f4b5abf31 / https://x.com/BBacktesting/status/1804481588941533255

(function() {
    'use strict';

    let panel;
    let isDragging = false;
    let startX;
    let startWidth;

    let chatObserver = null;

    function createSlideOutPanel(codeBlock) {
        if (panel) {
            panel.remove();
        }

        panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 0;
            right: 0;
            width: 600px;
            height: 100%;
            background: #f7f7f8;
            box-shadow: -2px 0 5px rgba(0,0,0,0.3);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            transition: transform 0.3s ease-in-out;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 10px;
            background: #282c34;
            color: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.cssText = `
            background: #ff5f57;
            border: none;
            border-radius: 5px;
            padding: 5px 10px;
            cursor: pointer;
            color: white;
        `;
        closeButton.onclick = () => panel.style.transform = 'translateX(100%)';

        header.appendChild(closeButton);
        panel.appendChild(header);

        const contentContainer = document.createElement('div');
        contentContainer.style.cssText = `
            padding: 10px;
            overflow-y: auto;
            flex-grow: 1;
        `;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            margin: 0;
            padding: 0;
        `;
        contentContainer.appendChild(iframe);
        panel.appendChild(contentContainer);

        document.body.appendChild(panel);

        // Clone the code block and remove the "Run Demo" and "Open in New Tab" buttons if they exist
        const cleanCodeBlock = codeBlock.cloneNode(true);
        const runDemoButton = cleanCodeBlock.querySelector('.run-demo-button');
        const openTabButton = cleanCodeBlock.querySelector('.open-tab-button');
        if (runDemoButton) {
            runDemoButton.remove();
        }
        if (openTabButton) {
            openTabButton.remove();
        }

        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(cleanCodeBlock.textContent);
        doc.close();

        setTimeout(() => panel.style.transform = 'translateX(0)', 0);

        header.addEventListener('mousedown', startDragging);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);

        // Close the panel if clicking outside
        document.addEventListener('click', function(event) {
            if (!panel.contains(event.target) && !event.target.closest('.run-demo-button') && !event.target.closest('.open-tab-button')) {
                panel.style.transform = 'translateX(100%)';
            }
        }, { once: true });
    }

    function openInNewTab(codeBlock) {
        const cleanCodeBlock = codeBlock.cloneNode(true);
        const runDemoButton = cleanCodeBlock.querySelector('.run-demo-button');
        const openTabButton = cleanCodeBlock.querySelector('.open-tab-button');
        if (runDemoButton) {
            runDemoButton.remove();
        }
        if (openTabButton) {
            openTabButton.remove();
        }

        const currentUrl = window.location.href;
        const newUrl = currentUrl + '/artefact';

        const newWindow = window.open(newUrl, '_blank');
        if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(cleanCodeBlock.textContent);

            // Update the URL display without navigating
            newWindow.history.pushState(null, '', newUrl);

            newWindow.document.close();
        } else {
            alert('Failed to open new tab. Please allow pop-ups for this site.');
        }
    }


    function addButtonsNextToCopy(codeBlock) {
        const outerContainer = codeBlock.closest('.relative');
        if (!outerContainer) return;

        const copyButtonContainer = outerContainer.querySelector('.absolute.bottom-0.right-2');
        if (!copyButtonContainer) return;

        // Check if the buttons are already added to prevent duplicates
        if (outerContainer.querySelector('.run-demo-button') || outerContainer.querySelector('.open-tab-button')) {
            return;
        }

        // Create a new span for our custom buttons
        const customButtonsSpan = document.createElement('span');
        customButtonsSpan.className = 'custom-buttons-span';
        customButtonsSpan.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            margin-right: 5px;
        `;

        const buttonStyle = `
            padding: 0 8px;  /* Adjust padding to control the button's width */
            height: 24px;  /* Set the fixed height to 24px */
            background: #2f2f2f;
            border: none;
            color: #b4b4b4;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;  /* Center the text */
            transition: background 0.3s, color 0.3s;
        `;

        // Create "Run Demo" button
        const runDemoButton = document.createElement('button');
        runDemoButton.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="margin-right: 4px; display: flex; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
                <div>Open Demo</div>
            </div>
        `;
        runDemoButton.className = 'run-demo-button custom-tooltip';
        runDemoButton.style.cssText = buttonStyle;
        runDemoButton.onclick = (e) => {
            e.stopPropagation();
            createSlideOutPanel(codeBlock);
        };

        // Create "Open in New Tab" button
        const openTabButton = document.createElement('button');
        openTabButton.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div style="margin-right: 4px; display: flex; align-items: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </div>
                <div>Open in New Tab</div>
            </div>
        `;
        openTabButton.className = 'open-tab-button custom-tooltip';
        openTabButton.style.cssText = buttonStyle;
        openTabButton.onclick = (e) => {
            e.stopPropagation();
            openInNewTab(codeBlock);
        };

        // Add hover effects
        [runDemoButton, openTabButton].forEach(button => {
            button.addEventListener('mouseover', () => {
                button.style.background = '#3f3f3f';
                button.style.color = '#ffffff';
            });
            button.addEventListener('mouseout', () => {
                button.style.background = '#2f2f2f';
                button.style.color = '#b4b4b4';
            });
        });

        // Add hover text for the buttons
        runDemoButton.setAttribute('data-hover-text', 'Open Demo in Slideout Panel');
        openTabButton.setAttribute('data-hover-text', 'Open in New Tab');

        // Add the new buttons to the custom span
        customButtonsSpan.appendChild(runDemoButton);
        customButtonsSpan.appendChild(openTabButton);

        // Insert the custom span before the existing span containing the "Copy code" button
        copyButtonContainer.insertBefore(customButtonsSpan, copyButtonContainer.firstChild);
    }

    function processCodeBlocks() {
        const codeBlocks = document.querySelectorAll('.overflow-y-auto');
        codeBlocks.forEach(codeBlock => {
            if (codeBlock.closest('.markdown')) {
                addButtonsNextToCopy(codeBlock);
            }
        });
    }

    function observeChat() {
        chatObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const codeBlocks = node.querySelectorAll('.overflow-y-auto');
                            codeBlocks.forEach(codeBlock => {
                                if (codeBlock.closest('.markdown')) {
                                    addButtonsNextToCopy(codeBlock);
                                }
                            });
                        }
                    });
                }
            });
        });

        const chatContainer = document.querySelector('main');
        if (chatContainer) {
            chatObserver.observe(chatContainer, { childList: true, subtree: true });
        }
    }

    function checkAndReinitialize() {
        const chatContainer = document.querySelector('main');
        if (!chatContainer || !chatObserver) {
            console.log("ChatGPT Artefacts: Observer not running or chat container missing, reinitializing...");
            reinitializeProcessor();
        } else {
            // Check if the observer is still connected to the DOM
            const observerActive = Array.from(chatObserver.takeRecords()).length > 0 || 
                                   chatObserver.observe(chatContainer, { childList: true, subtree: true });
            if (!observerActive) {
                console.log("ChatGPT Artefacts: Observer disconnected, reinitializing...");
                reinitializeProcessor();
            }
        }
    }    

    function setupPeriodicCheck() {
        setInterval(checkAndReinitialize, 10000); // Check every 60 seconds
    }    

    function addIndicator() {
        const indicator = document.createElement('div');
        indicator.textContent = 'Artefacts Active';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            padding: 5px 10px;
            background-color: #4CAF50;
            color: white;
            border-radius: 5px;
            font-size: 12px;
        `;
        document.body.appendChild(indicator);
        setTimeout(() => indicator.style.display = 'none', 3000);
    }

    function initializeProcessor() {
        addIndicator();
        processCodeBlocks();
        observeChat();
        setupPeriodicCheck();
    }

    function reinitializeProcessor() {
        try {
            chatObserver.disconnect();
            chatObserver = null;
        } catch (e) { }

        processCodeBlocks();
        observeChat();
    }

    // Use MutationObserver to wait for the chat interface to load
    const bodyObserver = new MutationObserver((mutations) => {
        if (document.querySelector('main')) {
            bodyObserver.disconnect();
            setTimeout(initializeProcessor, 500); // Delay execution by 0.5 seconds
        }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // Dragging functionality for the slide-out panel
    function startDragging(e) {
        isDragging = true;
        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(panel).width, 10);
        document.documentElement.addEventListener('mousemove', dragPanel, false);
        document.documentElement.addEventListener('mouseup', stopDragging, false);
    }

    function dragPanel(e) {
        if (!isDragging) return;
        let newWidth = startWidth - (e.clientX - startX);
        if (newWidth < 300) newWidth = 300;
        if (newWidth > 900) newWidth = 900;
        panel.style.width = newWidth + 'px';
    }

    function stopDragging(e) {
        isDragging = false;
        document.documentElement.removeEventListener('mousemove', dragPanel, false);
        document.documentElement.removeEventListener('mouseup', stopDragging, false);
    }

})();

GM_addStyle(`
    .custom-tooltip {
        position: relative;
        z-index: 10;
    }
    .custom-tooltip::after {
        content: attr(data-hover-text);
        position: absolute;
        bottom: 120%;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
        z-index: 11;
    }
    .custom-tooltip:hover::after {
        opacity: 1;
    }
    .custom-tooltip:hover + [role="tooltip"] {
        display: none !important;
    }
`);
