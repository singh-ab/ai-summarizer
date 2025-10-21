# AI Text Summarizer Extension - Setup Guide

## Quick Start

Follow these steps to get your Chrome extension running:

### Step 1: Enable Chrome AI Features

1. Open Chrome and type `chrome://flags` in the address bar
2. Search for these flags and enable them:

   - **Optimization Guide On Device Model** (`#optimization-guide-on-device-model`)
   - **Summarizer API** (`#summarizer-api` or search "summarizer")
   - **Prompt API for Gemini Nano** (if available)

3. Click "Relaunch" to restart Chrome

### Step 2: Verify Chrome Version

1. Go to `chrome://settings/help`
2. Ensure you have Chrome 138 or higher
3. If not, update Chrome to the latest version

### Step 3: Create Extension Icons

The extension needs icon files. (included)

### Step 4: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Navigate to and select the dir
5. Click "Select Folder"

### Step 5: First Time Setup

When you first use the extension:

1. Click the extension icon in Chrome's toolbar
2. The extension will check if the AI model is available
3. If needed, it will prompt to download Gemini Nano (~22GB)
4. The download may take 10-30 minutes depending on your connection
5. You need at least 22GB of free storage space

**Important**: Use an unmetered (unlimited) internet connection for the initial download.

### Step 6: Test the Extension

1. Open any webpage with text content
2. Click the extension icon
3. Try the "Summarize Current Page" button
4. Or select some text, right-click, and choose "Summarize selected text"

## Troubleshooting

### "API not available" Error

- Make sure Chrome flags are enabled (Step 1)
- Restart Chrome after enabling flags
- Check Chrome version is 138+
- Some regions may not have access yet

### "Model needs to be downloaded" Message

- This is normal on first use
- Ensure you have 22GB+ free storage
- Use unmetered internet connection
- Wait for the download to complete
- Check progress at `chrome://on-device-internals`

### Extension Won't Load

- Check all files are in the correct location
- Verify manifest.json is valid
- Look at Chrome console for errors (`chrome://extensions/` → Details → Inspect views)

### Icons Not Showing

- Create the icon files (see Step 3)
- Reload the extension after adding icons

### Summarization Fails

- Text must be at least 50 characters
- Try with shorter text segments
- Check that you clicked through any user activation prompts
- Try closing and reopening the extension

## Checking AI Model Status

Visit `chrome://on-device-internals` to see:

- Model download status
- Available storage
- Current model version
- API capabilities

## System Requirements Checklist

Before using, ensure you have:

- [ ] Chrome 138 or higher
- [ ] Supported OS (Windows 10/11, macOS 13+, Linux, or ChromeOS)
- [ ] 22+ GB free storage
- [ ] GPU with 4+ GB VRAM
- [ ] Unmetered internet connection (for download)
- [ ] Chrome AI flags enabled

## Usage Tips

### For Best Results:

- Use medium-length text (100-5000 words)
- Remove unnecessary HTML before summarizing
- Choose appropriate summary type for your content
- Try different length options for various use cases

### Summary Types Explained:

- **Key Points**: Bullet list of main ideas
- **TL;DR**: Quick overview/conclusion
- **Teaser**: Engaging preview to draw readers
- **Headline**: Single sentence capturing essence

### Context Menu Shortcuts:

- Right-click selected text → "Summarize selected text"
- Right-click page → "Summarize this page"

## Development & Customization

### File Structure:

```
AI Extension/
├── manifest.json       # Extension configuration
├── popup.html          # Main interface
├── popup.js            # Main logic
├── styles.css          # Styling
├── background.js       # Service worker
├── content.js          # Page interaction
├── icons/              # Extension icons
└── README.md           # Documentation
```

### Modifying the Extension:

1. Edit the files as needed
2. Go to `chrome://extensions/`
3. Click the reload icon on your extension
4. Test your changes

### Debugging:

- Open DevTools on the popup: Right-click extension icon → Inspect popup
- View background logs: chrome://extensions/ → Details → Inspect views: service worker
- Console errors show detailed API issues

## Support & Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai)
- [Summarizer API Reference](https://developer.chrome.com/docs/ai/summarizer-api)
- [Built-in AI Guide](https://developer.chrome.com/docs/ai/built-in)

## Next Steps

Once running, try:

1. Summarizing news articles
2. Creating quick overviews of documentation
3. Getting key points from long emails
4. Generating headlines for content
5. Creating teasers for blog posts

Enjoy your AI-powered summarization! 🚀
