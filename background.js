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
    // Check if text is selected
    if (!info.selectionText || info.selectionText.trim().length === 0) {
      console.log("No text selected");
      return;
    }
    
    // Send message to content script to handle summarization
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: "summarizeText",
        text: info.selectionText,
      });
    } catch (error) {
      console.error("Failed to send message to content script:", error);
      // Try to open popup as fallback
      try {
        await chrome.action.openPopup();
      } catch (popupError) {
        console.error("Failed to open popup:", popupError);
      }
    }
  } else if (info.menuItemId === "summarizePage") {
    // Open the popup which will handle page summarization
    try {
      await chrome.action.openPopup();
    } catch (error) {
      console.error("Failed to open popup:", error);
    }
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
  } else if (request.action === "summarizeText") {
    // Handle summarization request from content script
    handleSummarization(request.text, { context: request.context })
      .then((summary) => sendResponse({ success: true, summary }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  } else if (request.action === "testSummarizer") {
    // Test if Summarizer API is available in background context
    testSummarizerAvailability()
      .then((available) => sendResponse({ available }))
      .catch((error) => sendResponse({ available: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Helper function to handle summarization
async function handleSummarization(text, options = {}) {
  try {
    console.log("Background: Handling summarization request");
    console.log("Text length:", text?.length || 0);
    
    // Check if Summarizer API is available in background context
    if (!("Summarizer" in self)) {
      throw new Error("Summarizer API is not available in background context");
    }

    console.log("Checking summarizer availability...");
    const availability = await self.Summarizer.availability();
    console.log("Availability:", availability);
    
    if (availability === "unavailable" || availability === "no") {
      throw new Error("Summarizer is not available on this device");
    }

    console.log("Creating summarizer...");
    const summarizer = await self.Summarizer.create({
      type: "key-points",
      length: "medium", 
      format: "markdown",
      monitor(m) {
        try {
          m.addEventListener("downloadprogress", (e) => {
            console.log(`Model download: ${Math.round((e.loaded || 0) * 100)}%`);
          });
        } catch (err) {
          console.warn("Monitor setup failed:", err);
        }
      },
    });

    console.log("Summarizer created!");

    // Clean text
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("Cleaned text length:", cleanText.length);

    if (cleanText.length < 50) {
      throw new Error("Text is too short to summarize");
    }

    console.log("Generating summary...");
    const summary = await summarizer.summarize(cleanText, {
      context: options.context || "General text summarization",
    });

    console.log("Summary generated!", summary.substring(0, 100));

    // Cleanup
    summarizer.destroy();

    return summary;
  } catch (error) {
    console.error("Background summarization error:", error);
    throw error;
  }
}

// Test summarizer availability
async function testSummarizerAvailability() {
  try {
    console.log("Testing Summarizer API availability in background context");
    
    // Check if Summarizer API is available in background context
    if (!("Summarizer" in self)) {
      console.log("Summarizer API not available in background context");
      return false;
    }

    console.log("Summarizer API found, checking availability...");
    const availability = await self.Summarizer.availability();
    console.log("Background availability:", availability);
    
    if (availability === "unavailable" || availability === "no") {
      console.log("Summarizer not available on this device");
      return false;
    }
    
    console.log("Summarizer API is available in background context");
    return true;
  } catch (error) {
    console.error("Error testing summarizer availability:", error);
    return false;
  }
}

// Log extension startup
console.log("AI Text Summarizer background service worker started");
