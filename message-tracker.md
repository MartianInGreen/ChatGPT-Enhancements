## ChatGPT Message Tracker

### Description

The ChatGPT Message Tracker is a userscript designed to help you monitor and manage your message usage while interacting with ChatGPT. This tool tracks the number of messages you send based on the model you use and provides real-time statistics on your remaining message limits.

### Key Features:

- **Network Monitoring:** Automatically intercepts network requests sent to the ChatGPT API, specifically targeting the conversation endpoint.
  
- **Model-Specific Tracking:** Keeps track of usage limits for various models, including:
  - **gpt-4o:** 80 messages per 3 hours
  - **gpt-4o-mini:** No limits
  - **o1-preview:** 50 messages per week
  - **o1-mini:** 50 messages per day
  - **gpt-4:** 40 messages per 3 hours (counts towards gpt-4o usage)
  
- **Rolling Windows:** Utilizes rolling time windows to accurately calculate remaining messages based on the specified limits.

- **Persistent Storage:** Saves your message usage data and the collapse state of the tracker in `localStorage`, ensuring that your statistics and preferences persist across browser sessions and restarts.

- **User-Friendly Interface:** Displays a floating panel with your current message usage and remaining limits, with an option to close and reopen the tracker via a toggle button. The visibility of each model's usage details can be collapsed or expanded, with the state remembered between page reloads.

### How to Use:

1. Install the script using Tampermonkey or any compatible userscript manager.
2. Navigate to ChatGPT at [https://chatgpt.com/](https://chatgpt.com/).
3. View your message usage stats in the floating tracker panel.
4. Close the panel as needed and use the "Show Tracker" button to reopen it anytime.

### Notes:

- The script is open-source and can be modified to fit your specific needs.
- Please ensure you trust the source and understand the functionality of the script before installation.

I'm very happy to accept issues or pull requests on the [GitHub repository](https://github.com/MartianInGreen/ChatGPT-Enhancements).

### License:

This script is distributed under the MIT License.

---

### Changelog

#### Version 1.4.4 (Current)
- **Fix**: zIndex of toggle button.

#### Version 1.4.3 
- **Fix**: GPTs now always update the gpt-4o usage limit.

#### Version 1.4.2 
- **Compatibility**: Improved compatibility with my Artefacts script.
- **UI**: Enhanced auto update of times.

#### Version 1.4.1 
- **UI**: Changed shape, color and position of the show tracker button to better match native ChatGPT UI.

#### Version 1.4 
- **Added** support for the `gpt-4` model with a limit of 40 messages per 3 hours, which counts towards the `gpt-4o` usage cap.
- **Implemented** a feature to persist the collapsed or expanded state of each model's usage details between page reloads using `localStorage`.
- **Enhanced** the user interface with collapsible sections for each model, improving organization and readability.
- **Updated** the description and documentation to reflect the new features and changes.

#### Version 1.3
- **Introduced** collapsible model usage sections in the UI.
- **Added** an arrow indicator to show the collapse state of each model's usage details.
- **Fixed** minor CSS issues for better visual presentation.

#### Version 1.1
- **Initial Release:** Introduced message tracking for various ChatGPT models with network monitoring and persistent storage.