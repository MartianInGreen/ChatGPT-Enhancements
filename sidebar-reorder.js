// ==UserScript==
// @name         ChatGPT Sidebar GPT Reorder
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Reorder GPTs in ChatGPT sidebar with a custom sort list and add "See less" functionality.
// @author       @MartianInGreen
// @match        https://*.chatgpt.com/*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/508840/ChatGPT%20Sidebar%20GPT%20Reorder.user.js
// @updateURL https://update.greasyfork.org/scripts/508840/ChatGPT%20Sidebar%20GPT%20Reorder.meta.js
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CUSTOM_SORT_KEY = 'customGPTSort';
    const HIDDEN_GPTS_KEY = 'hiddenGPTs';
    const REORDER_BUTTON_ID = 'reorder-gpts-button';
    const SEE_LESS_BUTTON_ID = 'see-less-button';
    const SEE_MORE_BUTTON_ID = 'see-more-button';
    const MODAL_ID = 'gpt-sort-modal-overlay';
    const MAX_VISIBLE_GPTS = 5; // Number of GPTs to show when "See less" is activated

    // Add CSS for hidden GPTs
    const style = document.createElement('style');
    style.innerHTML = `
        .hidden-gpt {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // Utility function to wait for an element based on a predicate function
    function waitForElement(predicate, timeout = 20000) {
        return new Promise((resolve, reject) => {
            if (predicate()) {
                return resolve(predicate());
            }

            const observer = new MutationObserver(() => {
                if (predicate()) {
                    resolve(predicate());
                    observer.disconnect();
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Element not found within timeout.'));
            }, timeout);
        });
    }

    // Function to identify the target button (adjust if necessary)
    function identifyTargetButton() {
        // Example: Find a button with specific aria-label or class
        const buttons = Array.from(document.querySelectorAll('button'));
        for (let btn of buttons) {
            if (btn.textContent.toLowerCase().includes('more')) {
                return btn;
            }
            // Add other identification logic if needed
        }

        // Fallback
        return null;
    }

    // Function to get all GPT elements (Update selector based on actual DOM)
    function getAllGPTs() {
        // Updated selector based on provided HTML
        const gpts = Array.from(document.querySelectorAll('div[tabindex="0"] > a.group.flex.h-10'));
        console.log('Found GPTs:', gpts);
        return gpts;
    }

    // Function to get the GPT container (Update selector based on actual DOM)
    function getGPTContainer() {
        const gpts = getAllGPTs();
        if (gpts.length === 0) return null;
        const container = gpts[0].parentElement;
        console.log('GPT Container:', container);
        return container;
    }

    // Function to save custom sort to localStorage
    function saveCustomSort(sortList) {
        localStorage.setItem(CUSTOM_SORT_KEY, JSON.stringify(sortList));
    }

    // Function to load custom sort from localStorage
    function loadCustomSort() {
        const data = localStorage.getItem(CUSTOM_SORT_KEY);
        return data ? JSON.parse(data) : null;
    }

    // Function to save hidden GPTs to localStorage
    function saveHiddenGPTs(hiddenList) {
        localStorage.setItem(HIDDEN_GPTS_KEY, JSON.stringify(hiddenList));
    }

    // Function to load hidden GPTs from localStorage
    function loadHiddenGPTs() {
        const data = localStorage.getItem(HIDDEN_GPTS_KEY);
        return data ? JSON.parse(data) : [];
    }

    // Function to initialize custom sort
    function initializeCustomSort() {
        const gpts = getAllGPTs();
        const sortList = gpts.map(gpt => {
            const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary'); // Update selector if necessary
            return {
                name: nameElement ? nameElement.textContent.trim() : '',
                url: gpt.getAttribute('href'),
                icon: gpt.querySelector('img') ? gpt.querySelector('img').src : ''
            };
        });
        saveCustomSort(sortList);
        return sortList;
    }


    // Function to reorder GPTs based on sort list and hidden list
    function reorderGPTs(sortList, hiddenList = []) {
        const gptContainer = getGPTContainer();
        if (!gptContainer) {
            console.warn('GPT container not found. Cannot reorder GPTs.');
            return;
        }

        const gpts = getAllGPTs();
        const gptMap = {};
        gpts.forEach(gpt => {
            const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary'); // Update selector if necessary
            const name = nameElement ? nameElement.textContent.trim() : '';
            if (name) {
                gptMap[name] = gpt;
            }
        });

        // Identify any new GPTs not in the sortList
        const existingNames = sortList.map(item => item.name);
        const newGPTs = gpts.filter(gpt => {
            const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary');
            const name = nameElement ? nameElement.textContent.trim() : '';
            return name && !existingNames.includes(name);
        }).map(gpt => {
            const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary');
            return {
                name: nameElement ? nameElement.textContent.trim() : '',
                url: gpt.getAttribute('href'),
                icon: gpt.querySelector('img') ? gpt.querySelector('img').src : ''
            };
        });

        if (newGPTs.length > 0) {
            console.log('New GPTs detected:', newGPTs);
            sortList.push(...newGPTs);
            saveCustomSort(sortList);
        }

        // Apply hidden class based on hiddenList
        Object.keys(gptMap).forEach(name => {
            if (hiddenList.includes(name)) {
                gptMap[name].classList.add('hidden-gpt');
            } else {
                gptMap[name].classList.remove('hidden-gpt');
            }
        });

        // Reorder GPTs based on updated sortList
        sortList.forEach(item => {
            const gpt = gptMap[item.name];
            if (gpt && !hiddenList.includes(item.name)) {
                gptContainer.appendChild(gpt);
            }
        });
    }


    // Function to create the Sort UI Modal
    function createSortModal(sortList) {
        // If modal already exists, remove it
        const existingModal = document.getElementById(MODAL_ID);
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = MODAL_ID;
        Object.assign(modalOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '10000'
        });

        // Create modal content
        const modalContent = document.createElement('div');
        Object.assign(modalContent.style, {
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            width: '400px',
            maxHeight: '80%',
            overflowY: 'auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            color: '#000' // Set text color to black
        });

        // Modal header
        const header = document.createElement('h2');
        header.textContent = 'Reorder GPTs';
        Object.assign(header.style, {
            marginTop: '0',
            marginBottom: '10px',
            textAlign: 'center',
            color: '#000' // Ensure header text is black
        });
        modalContent.appendChild(header);

        // Instructions
        const instructions = document.createElement('p');
        instructions.textContent = 'Drag and drop the GPTs to reorder them. Click "Save" to apply changes or "Refresh" to revert.';
        Object.assign(instructions.style, {
            fontSize: '14px',
            marginBottom: '10px',
            textAlign: 'center',
            color: '#000' // Set text color to black
        });
        modalContent.appendChild(instructions);

        // Create list container
        const list = document.createElement('ul');
        list.id = 'gpt-sort-list';
        Object.assign(list.style, {
            listStyleType: 'none',
            padding: '0',
            marginBottom: '20px'
        });

        sortList.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = item.name;
            listItem.setAttribute('data-name', item.name);
            Object.assign(listItem.style, {
                padding: '6px 8px', // Reduced padding
                margin: '4px 0',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                cursor: 'grab',
                color: '#000', // Set list item text color to black
                fontSize: '14px', // Reduced font size
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            });
            list.appendChild(listItem);
        });

        modalContent.appendChild(list);

        // Buttons container
        const buttonsContainer = document.createElement('div');
        Object.assign(buttonsContainer.style, {
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
        });

        // Export button
        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export';
        Object.assign(exportButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#555555',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(exportButton);

        // Import button
        const importButton = document.createElement('button');
        importButton.textContent = 'Import';
        Object.assign(importButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#555555',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(importButton);

        // Refresh button
        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Refresh';
        Object.assign(refreshButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#ffa500', // Orange color for distinction
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(refreshButton);

        // Save button
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        Object.assign(saveButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(saveButton);

        // Cancel button
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        Object.assign(cancelButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#f44336',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(cancelButton);

        // Reset List button (Added)
        const resetListButton = document.createElement('button');
        resetListButton.textContent = 'Reset List';
        Object.assign(resetListButton.style, {
            padding: '6px 12px',
            fontSize: '14px',
            backgroundColor: '#ff9800', // Distinct color (e.g., orange)
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: '1 1 45%'
        });
        buttonsContainer.appendChild(resetListButton);

        modalContent.appendChild(buttonsContainer);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Make the list sortable using HTML5 Drag and Drop
        makeListSortable(list);

        // Event listeners for existing buttons
        cancelButton.addEventListener('click', () => {
            modalOverlay.remove();
        });

        saveButton.addEventListener('click', () => {
            const newSortList = [];
            const items = list.querySelectorAll('li');
            items.forEach(li => {
                const name = li.getAttribute('data-name');
                const found = sortList.find(item => item.name === name);
                if (found) newSortList.push(found);
            });

            // Update the sort list with any new GPTs
            const allGPTs = getAllGPTs();
            allGPTs.forEach(gpt => {
                const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary');
                const name = nameElement ? nameElement.textContent.trim() : '';
                if (!newSortList.find(item => item.name === name)) {
                    newSortList.push({
                        name: name,
                        url: gpt.getAttribute('href'),
                        icon: gpt.querySelector('img') ? gpt.querySelector('img').src : ''
                    });
                }
            });

            saveCustomSort(newSortList);
            reorderGPTs(newSortList, loadHiddenGPTs());
            modalOverlay.remove();
        });

        // Export functionality
        exportButton.addEventListener('click', () => {
            const dataStr = JSON.stringify(sortList, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'gpt_sort_order.json';
            a.click();

            URL.revokeObjectURL(url);
        });

        // Import functionality
        importButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = event => {
                    try {
                        const importedSortList = JSON.parse(event.target.result);
                        if (Array.isArray(importedSortList)) {
                            saveCustomSort(importedSortList);
                            reorderGPTs(importedSortList, loadHiddenGPTs());
                            modalOverlay.remove();
                            console.log('Sort order imported successfully.');
                        } else {
                            throw new Error('Invalid sort list format.');
                        }
                    } catch (err) {
                        console.error('Failed to import sort order:', err.message);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });

        // Refresh functionality
        refreshButton.addEventListener('click', () => {
            const currentSort = loadCustomSort();
            if (currentSort) {
                reorderGPTs(currentSort, loadHiddenGPTs());
                console.log('GPT list refreshed based on the current sort order.');
            } else {
                console.log('No custom sort list found.');
            }
        });

        // Reset List functionality (Added)
        resetListButton.addEventListener('click', () => {
            const currentSortList = loadCustomSort() || [];
            const allGPTs = getAllGPTs();
            const currentGPTNames = allGPTs.map(gpt => {
                const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary');
                return nameElement ? nameElement.textContent.trim() : '';
            });

            // Identify GPTs not in sortList
            const newGPTs = currentGPTNames.filter(name => !currentSortList.some(item => item.name === name));

            if (newGPTs.length === 0) {
                alert('No new GPTs to add to the sort list.');
                return;
            }

            // Add new GPTs to sortList
            newGPTs.forEach(name => {
                const gpt = allGPTs.find(gpt => {
                    const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary');
                    return nameElement ? nameElement.textContent.trim() === name : false;
                });

                if (gpt) {
                    currentSortList.push({
                        name: name,
                        url: gpt.getAttribute('href'),
                        icon: gpt.querySelector('img') ? gpt.querySelector('img').src : ''
                    });
                }
            });

            // Save updated sortList
            saveCustomSort(currentSortList);

            // Reorder GPTs with the updated sortList and existing hidden GPTs
            const hiddenGPTs = loadHiddenGPTs();
            reorderGPTs(currentSortList, hiddenGPTs);

            // Recreate the sort modal to reflect the updated list
            createSortModal(currentSortList);

            alert('New GPTs have been added to the sort list.');
        });
    }


    // Function to make a list sortable using Drag and Drop
    function makeListSortable(list) {
        let draggedItem = null;

        list.addEventListener('dragstart', (e) => {
            if (e.target.tagName.toLowerCase() === 'li') {
                draggedItem = e.target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.innerHTML);
                e.target.style.opacity = '0.5';
            }
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target;
            if (target && target !== draggedItem && target.nodeName === 'LI') {
                const rect = target.getBoundingClientRect();
                const next = (e.clientY - rect.top) > (rect.height / 2);
                list.insertBefore(draggedItem, next ? target.nextSibling : target);
            }
        });

        list.addEventListener('dragend', (e) => {
            if (draggedItem) {
                draggedItem.style.opacity = '1';
                draggedItem = null;
            }
        });

        // Make list items draggable
        const items = list.querySelectorAll('li');
        items.forEach(item => {
            item.setAttribute('draggable', 'true');
        });
    }

    // Function to create and inject the "Reorder GPTs" and "See Less/See More" buttons
    function injectSortAndSeeButtons() {
        const existingReorderButton = document.getElementById(REORDER_BUTTON_ID);
        const existingSeeLessButton = document.getElementById(SEE_LESS_BUTTON_ID);
        const existingSeeMoreButton = document.getElementById(SEE_MORE_BUTTON_ID);

        if (existingReorderButton || existingSeeLessButton || existingSeeMoreButton) return; // Prevent duplicate buttons

        const gptContainer = getGPTContainer();
        if (!gptContainer) {
            console.warn('GPT container not found. Cannot inject the "Reorder GPTs" and "See Less" buttons.');
            return;
        }

        // Create container for the buttons
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            gap: '10px',
            margin: '10px'
        });

        // Create "Reorder GPTs" button
        const reorderButton = document.createElement('button');
        reorderButton.id = REORDER_BUTTON_ID;
        reorderButton.textContent = 'Reorder GPTs';
        Object.assign(reorderButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#008CBA',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        reorderButton.addEventListener('click', () => {
            const sortList = loadCustomSort();
            if (sortList) {
                createSortModal(sortList);
            } else {
                console.log('No custom sort list found.');
            }
        });

        // Create "See Less" button
        const seeLessButton = document.createElement('button');
        seeLessButton.id = SEE_LESS_BUTTON_ID;
        seeLessButton.textContent = 'See Less';
        Object.assign(seeLessButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#e7e7e7',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
        });

        // Create "See More" button
        const seeMoreButton = document.createElement('button');
        seeMoreButton.id = SEE_MORE_BUTTON_ID;
        seeMoreButton.textContent = 'See More';
        Object.assign(seeMoreButton.style, {
            padding: '6px 12px', // Reduced padding
            fontSize: '14px', // Reduced font size
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'none' // Initially hidden
        });

        // Append buttons to the container
        buttonContainer.appendChild(reorderButton);
        buttonContainer.appendChild(seeLessButton);
        buttonContainer.appendChild(seeMoreButton);

        // Insert the button container at the top of the GPT container
        gptContainer.insertBefore(buttonContainer, gptContainer.firstChild);
        console.log('"Reorder GPTs" and "See Less" buttons injected.');

        // Event listener for "See Less"
        seeLessButton.addEventListener('click', () => {
            const allGPTs = getAllGPTs();
            if (allGPTs.length <= MAX_VISIBLE_GPTS) {
                console.log(`There are ${allGPTs.length} GPTs, which is within the visible limit.`);
                return;
            }

            const hiddenGPTs = allGPTs.slice(MAX_VISIBLE_GPTS).map(gpt => {
                const nameElement = gpt.querySelector('div.text-sm.text-token-text-primary'); // Update selector if necessary
                return nameElement ? nameElement.textContent.trim() : '';
            });

            // Save hidden GPTs to localStorage
            saveHiddenGPTs(hiddenGPTs);

            // Reorder GPTs with hidden GPTs
            const sortList = loadCustomSort();
            reorderGPTs(sortList, hiddenGPTs);

            // Toggle button visibility
            seeLessButton.style.display = 'none';
            seeMoreButton.style.display = 'inline-block';
        });

        // Event listener for "See More"
        seeMoreButton.addEventListener('click', () => {
            const hiddenGPTs = loadHiddenGPTs();
            if (hiddenGPTs.length === 0) {
                console.log('No GPTs are hidden.');
                return;
            }

            // Reorder GPTs without hidden GPTs
            const sortList = loadCustomSort();
            reorderGPTs(sortList, []);

            // Clear hidden GPTs from localStorage
            saveHiddenGPTs([]);

            // Toggle button visibility
            seeLessButton.style.display = 'inline-block';
            seeMoreButton.style.display = 'none';
        });

        // Automatically click the "See Less" button to set the default state
        const allGPTs = getAllGPTs();
        if (allGPTs.length > MAX_VISIBLE_GPTS) {
           if (seeLessButton && window.getComputedStyle(seeLessButton).display !== 'none') {
               seeLessButton.click();
           }
        }
    }


    // Function to attach a click listener to GPT items to reapply sort when a GPT is clicked
    async function attachGPTClickListener(gptContainer) {
        gptContainer.addEventListener('click', function(event) {
            reloadAll(event);
        });
    }

    async function reloadAll(event) {
        setTimeout(async function() {
            const gptItem = event.target.closest('a.group.flex.h-10');
            if (gptItem) {
                console.log('GPT item clicked:', gptItem);

                // Identify the sidebar button
                const sidebarButton = identifyTargetButton();
                if (!sidebarButton) {
                    console.error('Sidebar button could not be identified.');
                    return;
                }
                console.log('Sidebar button found:', sidebarButton);

                // Click the button to load all GPTs
                sidebarButton.click();
                console.log('Sidebar button clicked to load all GPTs.');

                try {
                    // Wait for GPTs to load
                    await waitForElement(() => getAllGPTs().length > 0, 20000);
                    console.log('GPTs loaded.');

                    // Initialize or load custom sort
                    let sortList = loadCustomSort();
                    if (!sortList) {
                        sortList = initializeCustomSort();
                        console.log('Custom sort initialized with default order.');
                    } else {
                        console.log('Custom sort loaded from localStorage.');
                    }

                    // Reorder GPTs with hidden GPTs
                    const hiddenGPTs = loadHiddenGPTs();
                    reorderGPTs(sortList, hiddenGPTs);
                    console.log('GPTs reordered based on custom sort.');

                    // Inject the "Reorder GPTs" and "See Less/See More" buttons
                    injectSortAndSeeButtons();
                } catch (err) {
                    console.error('Error loading GPTs:', err);
                }
            }
        }, 2000);
    }

    // Main function to orchestrate the script
    async function main() {
        try {
            console.log('ChatGPT Sidebar GPT Reorder script started.');

            // Wait for the sidebar button to load
            const sidebarButton = await waitForElement(identifyTargetButton, 20000);
            if (!sidebarButton) {
                throw new Error('Sidebar button could not be identified.');
            }
            console.log('Sidebar button found:', sidebarButton);

            // Click the button to load all GPTs
            sidebarButton.click();
            console.log('Sidebar button clicked to load all GPTs.');

            // Wait for GPTs to load
            await waitForElement(() => getAllGPTs().length > 0, 20000);
            console.log('GPTs loaded.');

            // Initialize or load custom sort
            let sortList = loadCustomSort();
            if (!sortList) {
                sortList = initializeCustomSort();
                console.log('Custom sort initialized with default order.');
            } else {
                console.log('Custom sort loaded from localStorage.');
            }

            // Reorder GPTs with hidden GPTs and update sort list if necessary
            const hiddenGPTs = loadHiddenGPTs();
            reorderGPTs(sortList, hiddenGPTs);
            console.log('GPTs reordered based on custom sort.');

            // Inject the "Reorder GPTs" and "See Less/See More" buttons
            injectSortAndSeeButtons();

            // Attach GPT click listener to handle dynamic changes
            const gptContainer = getGPTContainer();
            if (gptContainer) {
                attachGPTClickListener(gptContainer);
            }

        } catch (error) {
            console.error('ChatGPT Sidebar GPT Reorder script error:', error);
        }
    }

    // Attach event listener for 'popstate' to handle URL changes caused by browser navigation
    window.addEventListener('popstate', function(event) {
        console.log('URL changed:', window.location.href);
        main();
    });

    let url = window.location.href;

    // Optional: Use a MutationObserver to detect URL changes not caused by popstate (e.g., SPA routing)
    const observer = new MutationObserver(() => {
        if (window.location.href !== url) {
            url = window.location.href;
            main();
            setTimeout(function() {
                const seeLessButton = document.getElementById("see-less-button");

                // Check if the button exists and is not 'display: none'
                if (seeLessButton && window.getComputedStyle(seeLessButton).display !== 'none') {
                    seeLessButton.click();
                }
            }, 1000);
            setTimeout(function() {
                const seeLessButton = document.getElementById("see-less-button");

                // Check if the button exists and is not 'display: none'
                if (seeLessButton && window.getComputedStyle(seeLessButton).display !== 'none') {
                    seeLessButton.click();
                }
            }, 2000);
        }
    });

    // Observe changes to the document's title (as an example, adjust if necessary)
    observer.observe(document, { subtree: true, childList: true });

    // Run the main function after DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
        setTimeout(function() {
            const allGPTs = getAllGPTs();
            if (allGPTs.length > MAX_VISIBLE_GPTS) {
                const seeLessButton = document.getElementById("see-less-button")
                seeLessButton.click();
            }
        }, 1000);
    }

})();