// Content script for handling in-page summarization requests

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarizeText") {
    // Create a floating notification or modal to show the summary
    showSummaryModal(request.text);
    sendResponse({ success: true });
  }
  return true;
});

// Create and show a summary modal
async function showSummaryModal(text) {
  // Remove existing modal if present
  const existingModal = document.getElementById("ai-summarizer-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal container
  const modal = document.createElement("div");
  modal.id = "ai-summarizer-modal";
  modal.innerHTML = `
    <div class="ai-summarizer-overlay"></div>
    <div class="ai-summarizer-content">
      <div class="ai-summarizer-header">
        <h3>🤖 AI Summary</h3>
        <button class="ai-summarizer-close">×</button>
      </div>
      <div class="ai-summarizer-body">
        <div class="ai-summarizer-status">Generating summary...</div>
      </div>
      <div class="ai-summarizer-footer">
        <button class="ai-summarizer-copy">Copy</button>
        <button class="ai-summarizer-close-btn">Close</button>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #ai-summarizer-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    
    .ai-summarizer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    }
    
    .ai-summarizer-content {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translate(-50%, -48%);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%);
      }
    }
    
    .ai-summarizer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .ai-summarizer-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #202124;
    }
    
    .ai-summarizer-close {
      background: none;
      border: none;
      font-size: 32px;
      color: #5f6368;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .ai-summarizer-close:hover {
      background: #f1f3f4;
    }
    
    .ai-summarizer-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .ai-summarizer-status {
      text-align: center;
      color: #5f6368;
      padding: 20px;
      font-size: 14px;
    }
    
    .ai-summarizer-summary {
      line-height: 1.6;
      color: #202124;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .ai-summarizer-error {
      color: #d93025;
      padding: 12px;
      background: #fce8e6;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .ai-summarizer-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
    }
    
    .ai-summarizer-footer button {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .ai-summarizer-copy {
      background: #4285f4;
      color: white;
    }
    
    .ai-summarizer-copy:hover {
      background: #3367d6;
    }
    
    .ai-summarizer-close-btn {
      background: #f1f3f4;
      color: #202124;
    }
    
    .ai-summarizer-close-btn:hover {
      background: #e8eaed;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // Add event listeners
  const closeModal = () => {
    modal.style.animation = "slideOut 0.2s ease-in";
    setTimeout(() => modal.remove(), 200);
  };

  modal
    .querySelector(".ai-summarizer-close")
    .addEventListener("click", closeModal);
  modal
    .querySelector(".ai-summarizer-close-btn")
    .addEventListener("click", closeModal);
  modal
    .querySelector(".ai-summarizer-overlay")
    .addEventListener("click", closeModal);

  // Generate summary
  try {
    const summary = await generateSummary(text);
    const body = modal.querySelector(".ai-summarizer-body");
    body.innerHTML = `<div class="ai-summarizer-summary">${summary}</div>`;

    // Add copy functionality
    modal
      .querySelector(".ai-summarizer-copy")
      .addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(summary);
          const btn = modal.querySelector(".ai-summarizer-copy");
          const originalText = btn.textContent;
          btn.textContent = "✓ Copied!";
          setTimeout(() => (btn.textContent = originalText), 2000);
        } catch (error) {
          console.error("Failed to copy:", error);
        }
      });
  } catch (error) {
    const body = modal.querySelector(".ai-summarizer-body");
    body.innerHTML = `<div class="ai-summarizer-error">Failed to generate summary: ${error.message}</div>`;
  }
}

// Generate summary using the Summarizer API
async function generateSummary(text) {
  try {
    console.log("=== Content Script: Generate Summary ===");
    console.log("Text length:", text.length);

    // Check if Summarizer API is available - it's a global "Summarizer" object
    console.log("'Summarizer' in self?", "Summarizer" in self);

    if (!("Summarizer" in self)) {
      console.error("Summarizer API is not available");
      throw new Error(
        "Summarizer API is not available. Please enable 'Summarizer API' in chrome://flags"
      );
    }

    console.log("Checking summarizer availability...");
    const availability = await self.Summarizer.availability();
    console.log("Availability:", availability);
    if (availability === "unavailable" || availability === "no") {
      throw new Error("Summarizer is not available on this device");
    }

    console.log("Creating summarizer...");
    // Create summarizer
    const summarizer = await self.Summarizer.create({
      type: "key-points",
      length: "medium",
      format: "markdown",
      monitor(m) {
        try {
          m.addEventListener("downloadprogress", (e) => {
            console.log(
              `Model download: ${Math.round((e.loaded || 0) * 100)}%`
            );
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
    // Generate summary
    const summary = await summarizer.summarize(cleanText, {
      context: "Selected text from webpage",
    });

    console.log("Summary generated!", summary.substring(0, 100));

    // Cleanup
    summarizer.destroy();

    return summary;
  } catch (error) {
    console.error("Summary generation error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// Add style for slideOut animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -48%);
    }
  }
`;
document.head.appendChild(styleSheet);

console.log("AI Text Summarizer content script loaded");
