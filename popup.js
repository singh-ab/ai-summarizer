// DOM Elements
const elements = {
  apiStatus: document.getElementById("apiStatus"),
  statusText: document.getElementById("statusText"),
  summaryType: document.getElementById("summaryType"),
  summaryLength: document.getElementById("summaryLength"),
  summaryFormat: document.getElementById("summaryFormat"),
  summarizePage: document.getElementById("summarizePage"),
  summarizeSelection: document.getElementById("summarizeSelection"),
  summarizeInput: document.getElementById("summarizeInput"),
  textInput: document.getElementById("textInput"),
  progressContainer: document.getElementById("progressContainer"),
  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),
  summaryContainer: document.getElementById("summaryContainer"),
  summaryOutput: document.getElementById("summaryOutput"),
  copySummary: document.getElementById("copySummary"),
  errorContainer: document.getElementById("errorContainer"),
  errorText: document.getElementById("errorText"),
};

let summarizer = null;
let isApiAvailable = false;

// Initialize the extension
async function initialize() {
  try {
    console.log("=== AI Extension Initialization ===");
    console.log("Chrome version:", navigator.userAgent);
    console.log("Checking for AI API...");

    // Check if Summarizer API is available - it's a global object "Summarizer" (capital S)
    console.log("'Summarizer' in self?", "Summarizer" in self);
    console.log("'Summarizer' in window?", "Summarizer" in window);
    console.log("typeof Summarizer:", typeof self.Summarizer);

    if (!("Summarizer" in self)) {
      console.error("Summarizer API is not available");
      console.log(
        "Available globals:",
        Object.keys(self).filter(
          (k) =>
            k.includes("AI") || k.includes("ai") || k.includes("Summarizer")
        )
      );
      showError(
        "Summarizer API is not available in this browser. Please ensure you are using Chrome 138+ with 'Summarizer API' flag enabled in chrome://flags"
      );
      updateStatus("unavailable", "API not available");
      disableButtons(true);
      return;
    }

    console.log("Summarizer API found! Checking availability...");
    updateStatus("loading", "Checking AI availability...");

    // Summarizer.availability() returns string statuses like
    // 'unavailable' | 'readily' | 'downloadable' | 'downloading'
    // Some older docs/surfaces may use 'after-download' or 'no'. Handle broadly.
    const availability = await self.Summarizer.availability();
    console.log("Summarizer availability:", availability);

    const unavailableValues = new Set(["unavailable", "no"]);
    const needsDownloadValues = new Set([
      "downloadable",
      "downloading",
      "after-download",
    ]);

    if (unavailableValues.has(availability)) {
      console.error("Summarizer not available on this device");
      showError(
        "Summarizer is not available on this device. Please check the requirements (GPU with 4GB+ VRAM, 22GB+ storage)."
      );
      updateStatus("unavailable", "Not available on this device");
      disableButtons(true);
      return;
    }

    if (needsDownloadValues.has(availability)) {
      console.log("AI model needs to be downloaded or is downloading");
      updateStatus("loading", "AI model needs to be downloaded");
      showInfo(
        "The AI model will download on first use. This may take some time and requires ~22GB of storage."
      );
    } else if (availability === "readily") {
      console.log("AI is ready!");
      updateStatus("ready", "AI is ready!");
    } else {
      console.log("AI availability status:", availability);
      updateStatus("ready", `AI status: ${availability}`);
    }

    isApiAvailable = true;
    disableButtons(false);
    console.log("Initialization complete!");

    // Load saved preferences
    loadPreferences();
  } catch (error) {
    console.error("Initialization error:", error);
    console.error("Error stack:", error.stack);
    showError(`Initialization failed: ${error.message}`);
    updateStatus("error", "Initialization failed");
    disableButtons(true);
  }
}

// Update status indicator
function updateStatus(state, message) {
  elements.apiStatus.className = `status-box ${state}`;
  elements.statusText.textContent = message;
}

// Load user preferences from storage
async function loadPreferences() {
  try {
    const result = await chrome.storage.local.get([
      "summaryType",
      "summaryLength",
      "summaryFormat",
    ]);
    if (result.summaryType) elements.summaryType.value = result.summaryType;
    if (result.summaryLength)
      elements.summaryLength.value = result.summaryLength;
    if (result.summaryFormat)
      elements.summaryFormat.value = result.summaryFormat;
  } catch (error) {
    console.error("Failed to load preferences:", error);
  }
}

// Save user preferences
async function savePreferences() {
  try {
    await chrome.storage.local.set({
      summaryType: elements.summaryType.value,
      summaryLength: elements.summaryLength.value,
      summaryFormat: elements.summaryFormat.value,
    });
  } catch (error) {
    console.error("Failed to save preferences:", error);
  }
}

// Create summarizer with current options
async function createSummarizer() {
  try {
    console.log("Creating summarizer...");
    showProgress("Creating summarizer...");

    const options = {
      type: elements.summaryType.value,
      length: elements.summaryLength.value,
      format: elements.summaryFormat.value,
    };

    console.log("Summarizer options:", options);
    // Provide monitor to reflect download progress in UI
    summarizer = await self.Summarizer.create({
      ...options,
      monitor(m) {
        try {
          m.addEventListener("downloadprogress", (e) => {
            const pct = Math.round((e.loaded || 0) * 100);
            elements.progressContainer.style.display = "block";
            elements.progressBar.style.width = `${pct}%`;
            elements.progressText.textContent = `Downloading model: ${pct}%`;
          });
        } catch (err) {
          console.warn("Monitor setup failed:", err);
        }
      },
    });
    console.log("Summarizer created successfully!");

    return summarizer;
  } catch (error) {
    console.error("Failed to create summarizer:", error);
    console.error("Error details:", error.stack);
    throw error;
  }
}

// Summarize text
async function summarizeText(text, context = "") {
  console.log("=== Summarize Text Called ===");
  console.log("Text length:", text?.length || 0);
  console.log("Context:", context);

  if (!text || text.trim().length === 0) {
    console.warn("No text provided");
    showError("No text to summarize. Please provide some text.");
    return;
  }

  hideError();
  hideSummary();
  showProgress("Summarizing...");
  disableButtons(true);

  try {
    // Create or reuse summarizer
    if (!summarizer) {
      console.log("No existing summarizer, creating new one...");
      await createSummarizer();
    } else {
      console.log("Reusing existing summarizer");
    }

    // Clean the text (remove excessive HTML if present)
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("Cleaned text length:", cleanText.length);
    console.log("Text preview:", cleanText.substring(0, 200) + "...");

    if (cleanText.length < 50) {
      console.warn("Text too short:", cleanText.length);
      showError(
        "Text is too short to summarize effectively. Please provide at least 50 characters."
      );
      hideProgress();
      disableButtons(false);
      return;
    }

    showProgress("Processing text...");
    console.log("Calling summarizer.summarize()...");

    // Perform summarization
    const summary = await summarizer.summarize(cleanText, {
      context: context || "General text summarization",
    });

    console.log("Summary generated successfully!");
    console.log("Summary length:", summary?.length || 0);
    console.log("Summary preview:", summary?.substring(0, 100) + "...");

    hideProgress();
    showSummary(summary);
    disableButtons(false);
  } catch (error) {
    console.error("Summarization error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    hideProgress();
    showError(`Failed to summarize: ${error.message}`);
    disableButtons(false);

    // Reset summarizer on error
    if (summarizer) {
      try {
        console.log("Destroying failed summarizer...");
        summarizer.destroy();
      } catch (e) {
        console.error("Failed to destroy summarizer:", e);
      }
      summarizer = null;
    }
  }
}

// Show/Hide UI elements
function showProgress(message) {
  elements.progressContainer.style.display = "block";
  elements.progressText.textContent = message;
  elements.progressBar.style.width = "50%";
}

function hideProgress() {
  elements.progressContainer.style.display = "none";
  elements.progressBar.style.width = "0%";
}

function showSummary(summary) {
  elements.summaryContainer.style.display = "block";
  elements.summaryOutput.textContent = summary;
}

function hideSummary() {
  elements.summaryContainer.style.display = "none";
  elements.summaryOutput.textContent = "";
}

function showError(message) {
  elements.errorContainer.style.display = "block";
  elements.errorText.textContent = message;
}

function hideError() {
  elements.errorContainer.style.display = "none";
  elements.errorText.textContent = "";
}

function showInfo(message) {
  // Could display an info message
  console.info(message);
}

function disableButtons(disabled) {
  elements.summarizePage.disabled = disabled;
  elements.summarizeSelection.disabled = disabled;
  elements.summarizeInput.disabled = disabled;
}

// Event Listeners
elements.summarizePage.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Inject content script to get page text
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get visible text from the page
        const article = document.querySelector("article");
        if (article) {
          return article.innerText;
        }

        const main = document.querySelector("main");
        if (main) {
          return main.innerText;
        }

        // Fallback to body text
        return document.body.innerText;
      },
    });

    if (results && results[0] && results[0].result) {
      const pageText = results[0].result;
      await summarizeText(pageText, "Article or webpage content");
    } else {
      showError("Could not extract text from the current page.");
    }
  } catch (error) {
    console.error("Error getting page content:", error);
    showError(`Failed to get page content: ${error.message}`);
  }
});

elements.summarizeSelection.addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Get selected text from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });

    if (results && results[0] && results[0].result) {
      const selectedText = results[0].result;
      if (selectedText.trim()) {
        await summarizeText(selectedText, "Selected text");
      } else {
        showError("No text is currently selected on the page.");
      }
    } else {
      showError("Could not get selected text.");
    }
  } catch (error) {
    console.error("Error getting selection:", error);
    showError(`Failed to get selected text: ${error.message}`);
  }
});

elements.summarizeInput.addEventListener("click", async () => {
  const text = elements.textInput.value;
  await summarizeText(text, "User provided text");
});

elements.copySummary.addEventListener("click", async () => {
  try {
    const summary = elements.summaryOutput.textContent;
    await navigator.clipboard.writeText(summary);

    // Visual feedback
    const originalText = elements.copySummary.textContent;
    elements.copySummary.textContent = "✓ Copied!";
    setTimeout(() => {
      elements.copySummary.textContent = originalText;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy:", error);
    showError("Failed to copy summary to clipboard.");
  }
});

// Save preferences when changed
elements.summaryType.addEventListener("change", savePreferences);
elements.summaryLength.addEventListener("change", savePreferences);
elements.summaryFormat.addEventListener("change", savePreferences);

// Cleanup on unload
window.addEventListener("unload", () => {
  if (summarizer) {
    try {
      summarizer.destroy();
    } catch (error) {
      console.error("Failed to destroy summarizer:", error);
    }
  }
});

// Initialize the extension
initialize();
