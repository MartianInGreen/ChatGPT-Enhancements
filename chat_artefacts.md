## ChatGPT Artefacts

### Description

ChatGPT Artefacts is a userscript that enhances your ChatGPT experience by adding Claude-like artefact functionality to code blocks. This script allows you to open code snippets in a side panel or a new tab, making it easier to view and interact with code examples provided by ChatGPT.

### Key Features:

- **Run Demo Button:** Adds a "Run Demo" button next to code blocks, allowing you to open the code in a slide-out side panel.
  
- **Open in New Tab Button:** Provides an "Open in New Tab" button to view the code in a separate browser tab.
  
- **Slide-out Panel:** A resizable side panel that displays the code content in an iframe for easy viewing.

- **Code Cleaning:** Automatically removes the added buttons when displaying code in the side panel or new tab.

- **Responsive Design:** The side panel is draggable and resizable, with a minimum width of 300px and a maximum of 900px.

- **Visual Enhancements:** Hover effects and tooltips for buttons, improving user experience.

### How to Use:

1. Install the script using Tampermonkey or any compatible userscript manager.
2. Navigate to ChatGPT at [https://chatgpt.com/](https://chatgpt.com/).
3. Look for the new "Open Demo" and "Open in New Tab" buttons next to code blocks.
4. Click "Open Demo" to view the code in a side panel, or "Open in New Tab" to open it in a new browser tab.

### Notes:

- The script automatically processes existing code blocks and observes for new ones as you interact with ChatGPT.
- I recommend the use of this [GPT](https://chatgpt.com/g/g-OtVzlVWW6-artefacty).
- An "Artefacts Active" indicator briefly appears when the script is loaded successfully.
- The side panel can be closed using the "Close" button or by clicking outside the panel.
- Works with Javascript. Must disable CSP policy. Disable at own risk. I recommend using something like [CORS Unblock](https://webextension.org/listing/access-control.html), downloading it from [Github](https://github.com/balvin-perrie/Access-Control-Allow-Origin---Unblock) and changing the urls it is allowed to access in the manifest.json to only the https://chatgpt.com/ domain.

### Compatibility:

This script is designed for use on the ChatGPT platform (https://\*.chatgpt.com/\*).

### Author:

- **MartianInGreen**
- Based on script made by [CurtisAccelerate](https://github.com/CurtisAccelerate) @ [GitHub Gist](https://gist.github.com/CurtisAccelerate/64a20b1d5df6240119bb0a3f4b5abf31) / [Twitter Post](https://x.com/BBacktesting/status/1804481588941533255)
  
Issues and pull requests are welcome on the [GitHub repository](https://github.com/MartianInGreen/ChatGPT-Enhancements).

### License:

This script is distributed under the MIT License.

---

### Changelog

#### Version 1.1 (Current)
- **Improvement**: Auto reinitialization of the backend-processes when the observer is disconnected. Should lead to improved reliability of the buttons always appearing.

#### Version 1.0 
- Initial release with core functionality for opening code demos in a side panel or new tab.
- Added responsive design for the side panel with drag-to-resize feature.
- Implemented automatic code block processing and dynamic button addition.
