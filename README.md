# AI Text Summarizer - Chrome Extension

A Chrome extension that uses the built-in Chrome AI Summarizer API (Gemini Nano) to generate intelligent summaries of text content from web pages.

## ✨ Features

- **Multiple Summary Types**

  - Key Points (bullet list format)
  - TL;DR (concise overview)
  - Teaser (engaging preview)
  - Headline (single sentence summary)

- **Flexible Length Options**

  - Short, Medium, or Long summaries
  - Adaptive to content type

- **Multiple Input Methods**

  - Summarize entire web pages
  - Summarize selected text (right-click context menu)
  - Paste text directly into the extension

- **Format Options**

  - Markdown (with formatting)
  - Plain text

- **User-Friendly Interface**
  - Clean, modern design
  - Real-time progress indicators
  - One-click copy to clipboard
  - Persistent preferences

## 🔧 Requirements

### System Requirements

- **Chrome Version**: 138 or higher
- **Operating Systems**:
  - Windows 10/11
  - macOS 13+ (Ventura and onwards)
  - Linux
  - ChromeOS (Platform 16389.0.0+) on Chromebook Plus devices

### Hardware Requirements

- **Storage**: At least 22 GB of free space
- **GPU**: More than 4 GB of VRAM
- **Network**: Unlimited data or unmetered connection (for initial model download)

### Enable Chrome AI Features

1. Open Chrome and go to `chrome://flags`
2. Search for "Summarizer API" or "Built-in AI"
3. Enable the following flags:
   - `#optimization-guide-on-device-model`
   - `#summarizer-api`
4. Restart Chrome

## 📦 Installation

### Development Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the extension directory (the folder containing `manifest.json`)

### First Run

On first use, the extension will download the Gemini Nano model (~22GB). This is a one-time process and may take several minutes depending on your connection speed.

## 🚀 Usage

### Method 1: Extension Popup

1. Click the extension icon in the Chrome toolbar
2. Choose your summary preferences (type, length, format)
3. Either:
   - Click "Summarize Current Page" to summarize visible content
   - Click "Summarize Selected Text" if you have text selected
   - Paste text into the text area and click "Summarize Text"

### Method 2: Context Menu

1. Select text on any webpage
2. Right-click and choose "Summarize selected text"
3. View the summary in a modal overlay

### Method 3: Page Summary

1. Click the extension icon
2. Click "Summarize Current Page" to get a summary of the main content

## 🎨 Customization

The extension saves your preferences automatically:

- Summary Type
- Summary Length
- Output Format

Your preferences persist across sessions.

## 🛠️ Technical Details

### Architecture

- **Manifest Version**: 3
- **Permissions**: activeTab, contextMenus, scripting, storage
- **API Used**: Chrome's built-in Summarizer API (Gemini Nano)

### Files Structure

```
AI Extension/
├── manifest.json       # Extension configuration
├── popup.html          # Main UI
├── popup.js            # Popup logic
├── styles.css          # Styling
├── background.js       # Service worker
├── content.js          # Content script for in-page functionality
├── icons/              # Extension icons (16, 32, 48, 128)
└── README.md           # This file
```

## 🐛 Troubleshooting

### "API not available"

- Ensure you're using Chrome 138 or higher
- Check that the required flags are enabled in `chrome://flags`
- Verify your system meets the hardware requirements

### "Model needs to be downloaded"

- The first use requires downloading Gemini Nano (~22GB)
- Ensure you have sufficient storage and an unmetered connection
- Check `chrome://on-device-internals` for model status

### "Not available on this device"

- Verify your OS is supported
- Check GPU requirements (>4GB VRAM)
- Ensure sufficient storage space (22GB+ free)

### Summarization Fails

- Try shorter text segments
- Check that the text has at least 50 characters
- Restart Chrome if issues persist

## 📚 Resources

- [Chrome AI Documentation](https://developer.chrome.com/docs/ai)
- [Summarizer API Guide](https://developer.chrome.com/docs/ai/summarizer-api)
- [Gemini Nano Information](https://developer.chrome.com/docs/ai/built-in)

## 🎯 Future Enhancements

Potential features for future versions:

- Batch summarization of multiple pages
- Summary history
- Export summaries to various formats
- Custom summary templates
- Integration with other Chrome AI APIs (Writer, Rewriter, etc.)
- Streaming summarization for real-time updates

## ⚖️ License

This project is provided as-is for educational and personal use.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## ⚠️ Important Notes

- This extension requires Chrome's experimental AI features
- Gemini Nano is a generative AI model - results may vary
- Review Google's [Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy)
- First download requires significant storage and bandwidth
- API availability may vary by region and device

## 📝 Acknowledgments

Built using Chrome's Built-in AI APIs and the Gemini Nano model. Part of the Google Chrome Built-in AI initiative.

---

**Enjoy summarizing!** 🚀✨
