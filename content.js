// Content script for handling in-page summarization requests

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarizeText") {
    // Create a floating notification or modal to show the summary
    showSummaryModal(request.text);
    sendResponse({ success: true });
  } else if (request.action === "getSelectedText") {
    // Get selected text and send it back
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
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

  // Validate text input
  if (!text || text.trim().length === 0) {
    console.error("No text provided for summarization");
    return;
  }

  if (text.trim().length < 50) {
    console.warn("Text too short for summarization");
    showErrorModal("Text is too short to summarize effectively. Please select at least 50 characters.");
    return;
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

    // The Summarizer API is not available in content scripts
    // We need to send the request to the popup or background script
    // For now, we'll use a simple fallback or send to popup
    console.log("Content script cannot access Summarizer API directly");
    
    // Send message to background script to handle summarization
    const response = await chrome.runtime.sendMessage({
      action: "summarizeText",
      text: text,
      context: "Selected text from webpage"
    });

    if (response && response.success) {
      return response.summary;
    } else {
      throw new Error(response?.error || "Failed to generate summary");
    }
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

// Show error modal
function showErrorModal(message) {
  // Remove existing modal if present
  const existingModal = document.getElementById("ai-summarizer-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Create error modal
  const modal = document.createElement("div");
  modal.id = "ai-summarizer-modal";
  modal.innerHTML = `
    <div class="ai-summarizer-overlay"></div>
    <div class="ai-summarizer-content">
      <div class="ai-summarizer-header">
        <h3>⚠️ Error</h3>
        <button class="ai-summarizer-close">×</button>
      </div>
      <div class="ai-summarizer-body">
        <div class="ai-summarizer-error">${message}</div>
      </div>
      <div class="ai-summarizer-footer">
        <button class="ai-summarizer-close-btn">Close</button>
      </div>
    </div>
  `;

  // Add the same styles as the main modal
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
}

console.log("AI Text Summarizer content script loaded");
