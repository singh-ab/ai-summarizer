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

  // Generate comprehensive analysis
  try {
    const analysis = await generateAnalysis(text);
    const body = modal.querySelector(".ai-summarizer-body");
    body.innerHTML = createAnalysisHTML(analysis);

    // Add copy functionality for summary
    modal
      .querySelector(".ai-summarizer-copy")
      .addEventListener("click", async () => {
        try {
          const summaryText = analysis.summary || analysis.analysis;
          await navigator.clipboard.writeText(summaryText);
          const btn = modal.querySelector(".ai-summarizer-copy");
          const originalText = btn.textContent;
          btn.textContent = "✓ Copied!";
          setTimeout(() => (btn.textContent = originalText), 2000);
        } catch (error) {
          console.error("Failed to copy:", error);
        }
      });

    // Add query functionality
    addQueryFunctionality(modal, analysis);
  } catch (error) {
    const body = modal.querySelector(".ai-summarizer-body");
    body.innerHTML = `<div class="ai-summarizer-error">Failed to generate analysis: ${error.message}</div>`;
  }
}

// Generate comprehensive analysis using multiple Chrome APIs
async function generateAnalysis(text) {
  try {
    console.log("=== Content Script: Generate Analysis ===");
    console.log("Text length:", text.length);

    // Send message to background script to handle comprehensive analysis
    const response = await chrome.runtime.sendMessage({
      action: "analyzeText",
      text: text,
      context: "Selected text from webpage"
    });

    if (response && response.success) {
      return response.analysis;
    } else {
      throw new Error(response?.error || "Failed to generate analysis");
    }
  } catch (error) {
    console.error("Analysis generation error:", error);
    console.error("Error stack:", error.stack);
    throw error;
  }
}

// Generate summary using the Summarizer API (legacy function for compatibility)
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

// Add style for slideOut animation and analysis components
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
  
  /* Analysis Styles */
  .analysis-container {
    max-height: 60vh;
    overflow-y: auto;
  }
  
  .analysis-summary, .danger-analysis, .translations, .query-section {
    margin-bottom: 20px;
    padding: 15px;
    border-radius: 8px;
    background: #f8f9fa;
  }
  
  .analysis-summary h4, .danger-analysis h4, .translations h4, .query-section h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: 600;
    color: #202124;
  }
  
  .summary-content {
    line-height: 1.6;
    color: #202124;
  }
  
  /* Danger Points Styles */
  .danger-points {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .danger-point {
    padding: 12px;
    border-radius: 6px;
    border-left: 4px solid;
  }
  
  .danger-point.danger-critical {
    background: #fce8e6;
    border-left-color: #d93025;
  }
  
  .danger-point.danger-high {
    background: #fef7e0;
    border-left-color: #fbbc04;
  }
  
  .danger-point.danger-medium {
    background: #e8f0fe;
    border-left-color: #4285f4;
  }
  
  .danger-point.danger-low {
    background: #e8f5e9;
    border-left-color: #34a853;
  }
  
  .danger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  
  .danger-rating {
    background: #202124;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 12px;
  }
  
  .danger-title {
    font-weight: 600;
    color: #202124;
  }
  
  .danger-description {
    font-size: 14px;
    color: #5f6368;
    line-height: 1.5;
  }
  
  /* Translation Styles */
  .translation-tabs {
    display: flex;
    gap: 5px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }
  
  .translation-tab {
    padding: 6px 12px;
    border: 1px solid #dadce0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  }
  
  .translation-tab:hover {
    background: #f1f3f4;
  }
  
  .translation-tab.active {
    background: #4285f4;
    color: white;
    border-color: #4285f4;
  }
  
  .translation-text {
    line-height: 1.6;
    color: #202124;
  }
  
  /* Query Styles */
  .query-input-container {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .query-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #dadce0;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .query-input:focus {
    outline: none;
    border-color: #4285f4;
  }
  
  .query-submit {
    padding: 8px 16px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .query-submit:hover {
    background: #3367d6;
  }
  
  .query-response {
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #dadce0;
  }
  
  .query-answer {
    color: #202124;
    line-height: 1.6;
  }
  
  .query-loading {
    color: #5f6368;
    font-style: italic;
  }
  
  .query-error {
    color: #d93025;
    background: #fce8e6;
    padding: 8px;
    border-radius: 4px;
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

// Create HTML for analysis results
function createAnalysisHTML(analysis) {
  let html = `
    <div class="analysis-container">
      <div class="analysis-summary">
        <h4>📋 Summary</h4>
        <div class="summary-content">${analysis.summary || analysis.analysis}</div>
      </div>
  `;

  // Add danger ratings if available
  if (analysis.dangerPoints && analysis.dangerPoints.length > 0) {
    html += `
      <div class="danger-analysis">
        <h4>⚠️ Critical Points (Danger Rating)</h4>
        <div class="danger-points">
    `;
    
    analysis.dangerPoints.forEach((point, index) => {
      const dangerClass = getDangerClass(point.rating);
      html += `
        <div class="danger-point ${dangerClass}">
          <div class="danger-header">
            <span class="danger-rating">${point.rating}/10</span>
            <span class="danger-title">${point.title}</span>
          </div>
          <div class="danger-description">${point.description}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }

  // Add translations if available
  if (analysis.translations && Object.keys(analysis.translations).length > 0) {
    html += `
      <div class="translations">
        <h4>🌍 Translations</h4>
        <div class="translation-tabs">
    `;
    
    Object.entries(analysis.translations).forEach(([lang, translation]) => {
      html += `
        <button class="translation-tab" data-lang="${lang}">${getLanguageName(lang)}</button>
      `;
    });
    
    html += `
        </div>
        <div class="translation-content">
    `;
    
    Object.entries(analysis.translations).forEach(([lang, translation]) => {
      html += `
        <div class="translation-panel" data-lang="${lang}" style="display: none;">
          <div class="translation-text">${translation}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  }

  // Add query section
  html += `
      <div class="query-section">
        <h4>❓ Ask Questions</h4>
        <div class="query-input-container">
          <input type="text" class="query-input" placeholder="Ask about this content..." />
          <button class="query-submit">Ask</button>
        </div>
        <div class="query-response" style="display: none;"></div>
      </div>
    </div>
  `;

  return html;
}

// Get danger class based on rating
function getDangerClass(rating) {
  if (rating >= 8) return "danger-critical";
  if (rating >= 6) return "danger-high";
  if (rating >= 4) return "danger-medium";
  return "danger-low";
}

// Get language name from code
function getLanguageName(code) {
  const languages = {
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  return languages[code] || code.toUpperCase();
}

// Add query functionality
function addQueryFunctionality(modal, analysis) {
  const queryInput = modal.querySelector(".query-input");
  const querySubmit = modal.querySelector(".query-submit");
  const queryResponse = modal.querySelector(".query-response");

  querySubmit.addEventListener("click", async () => {
    const question = queryInput.value.trim();
    if (!question) return;

    queryResponse.style.display = "block";
    queryResponse.innerHTML = "<div class='query-loading'>Generating response...</div>";

    try {
      const response = await chrome.runtime.sendMessage({
        action: "answerQuery",
        question: question,
        context: analysis.summary || analysis.analysis,
        originalText: analysis.originalText
      });

      if (response && response.success) {
        queryResponse.innerHTML = `<div class="query-answer">${response.answer}</div>`;
      } else {
        queryResponse.innerHTML = `<div class="query-error">Failed to generate response: ${response?.error || 'Unknown error'}</div>`;
      }
    } catch (error) {
      queryResponse.innerHTML = `<div class="query-error">Error: ${error.message}</div>`;
    }
  });

  // Add translation tab functionality
  const translationTabs = modal.querySelectorAll(".translation-tab");
  const translationPanels = modal.querySelectorAll(".translation-panel");

  translationTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const lang = tab.dataset.lang;
      
      // Update active tab
      translationTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      
      // Show corresponding panel
      translationPanels.forEach(panel => {
        panel.style.display = panel.dataset.lang === lang ? "block" : "none";
      });
    });
  });

  // Activate first translation tab
  if (translationTabs.length > 0) {
    translationTabs[0].click();
  }
}

console.log("AI Text Summarizer content script loaded");
