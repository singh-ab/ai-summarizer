// Background service worker for context menu and message handling

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarizeSelection",
    title: "Summarize selected text",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "summarizePage",
    title: "Summarize this page",
    contexts: ["page"],
  });

  console.log("AI Text Summarizer extension installed");
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarizeSelection") {
    // Send message to content script to handle summarization
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "summarizeText",
        text: info.selectionText,
      });
    } catch (error) {
      console.error("Failed to send message to content script:", error);
      // Open popup as fallback
      chrome.action.openPopup();
    }
  } else if (info.menuItemId === "summarizePage") {
    // Open the popup which will handle page summarization
    chrome.action.openPopup();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSummary") {
    // Forward request to appropriate handler
    handleSummarization(request.text, request.options)
      .then((summary) => sendResponse({ success: true, summary }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Helper function to handle summarization
async function handleSummarization(text, options = {}) {
  // This is a placeholder - actual summarization happens in popup/content script
  // because service workers have limitations with the Summarizer API
  throw new Error(
    "Summarization should be handled in the popup or content script"
  );
}

// Log extension startup
console.log("AI Text Summarizer background service worker started");
