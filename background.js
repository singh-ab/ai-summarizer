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
  } else if (request.action === "analyzeText") {
    // Handle comprehensive analysis request
    handleComprehensiveAnalysis(request.text, { context: request.context })
      .then((analysis) => sendResponse({ success: true, analysis }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  } else if (request.action === "answerQuery") {
    // Handle user query about analyzed content
    handleUserQuery(request.question, request.context, request.originalText)
      .then((answer) => sendResponse({ success: true, answer }))
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

// Handle comprehensive analysis using multiple Chrome APIs
async function handleComprehensiveAnalysis(text, options = {}) {
  try {
    console.log("Background: Handling comprehensive analysis request");
    console.log("Text length:", text?.length || 0);
    
    const analysis = {
      originalText: text,
      summary: "",
      dangerPoints: [],
      translations: {},
      timestamp: new Date().toISOString()
    };

    // Step 1: Generate summary using Summarizer API
    try {
      if ("Summarizer" in self) {
        console.log("Using Summarizer API for summary...");
        const summarizer = await self.Summarizer.create({
          type: "key-points",
          length: "medium",
          format: "markdown"
        });
        
        const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        analysis.summary = await summarizer.summarize(cleanText, {
          context: options.context || "General text analysis"
        });
        
        summarizer.destroy();
      } else {
        // Fallback summary
        analysis.summary = "Summary not available - Summarizer API not accessible";
      }
    } catch (error) {
      console.error("Summary generation failed:", error);
      analysis.summary = "Failed to generate summary: " + error.message;
    }

    // Step 2: Analyze for danger points and risks
    try {
      analysis.dangerPoints = await analyzeDangerPoints(text);
    } catch (error) {
      console.error("Danger analysis failed:", error);
      analysis.dangerPoints = [];
    }

    // Step 3: Generate translations using Translator API
    try {
      if ("Translator" in self) {
        console.log("Using Translator API for translations...");
        const translator = await self.Translator.create();
        
        const targetLanguages = ['es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'];
        
        for (const lang of targetLanguages) {
          try {
            const translation = await translator.translate(text, {
              targetLanguage: lang,
              sourceLanguage: 'auto'
            });
            analysis.translations[lang] = translation;
          } catch (langError) {
            console.warn(`Translation to ${lang} failed:`, langError);
          }
        }
        
        translator.destroy();
      } else {
        console.log("Translator API not available");
      }
    } catch (error) {
      console.error("Translation generation failed:", error);
    }

    console.log("Comprehensive analysis completed");
    return analysis;
  } catch (error) {
    console.error("Comprehensive analysis error:", error);
    throw error;
  }
}

// Analyze text for potential dangers and risks
async function analyzeDangerPoints(text) {
  const dangerPoints = [];
  
  // Define risk patterns and their danger ratings
  const riskPatterns = [
    {
      pattern: /(?:liability|damages|compensation|penalty|fine|fee|charge|cost|expense|payment|refund|cancellation|termination|breach|violation|default|forfeit)/gi,
      category: "Financial Risk",
      baseRating: 7
    },
    {
      pattern: /(?:privacy|personal data|information|collect|store|share|sell|disclose|access|monitor|track|surveillance)/gi,
      category: "Privacy Risk",
      baseRating: 8
    },
    {
      pattern: /(?:warranty|guarantee|support|service|maintenance|repair|replacement|defect|fault|error|bug|issue)/gi,
      category: "Service Risk",
      baseRating: 5
    },
    {
      pattern: /(?:exclusive|sole|only|restrict|limit|prohibit|forbid|ban|block|prevent|stop)/gi,
      category: "Restriction Risk",
      baseRating: 6
    },
    {
      pattern: /(?:automatic|auto|renew|subscription|recurring|monthly|annual|yearly|billing|charge|debit|credit)/gi,
      category: "Subscription Risk",
      baseRating: 7
    },
    {
      pattern: /(?:disclaimer|limitation|exclusion|exempt|immune|protected|shielded|indemnified)/gi,
      category: "Legal Protection",
      baseRating: 9
    },
    {
      pattern: /(?:arbitration|mediation|court|lawsuit|litigation|dispute|conflict|resolution)/gi,
      category: "Legal Process",
      baseRating: 8
    },
    {
      pattern: /(?:modify|change|alter|update|revise|amend|edit|adjust)/gi,
      category: "Modification Risk",
      baseRating: 4
    }
  ];

  // Analyze text for each risk pattern
  riskPatterns.forEach(risk => {
    const matches = text.match(risk.pattern);
    if (matches && matches.length > 0) {
      // Calculate danger rating based on frequency and context
      let rating = risk.baseRating;
      if (matches.length > 3) rating += 1;
      if (matches.length > 6) rating += 1;
      
      // Look for intensifying words
      const intensifiers = /(?:severe|serious|major|significant|substantial|considerable|extreme|maximum|total|complete|absolute)/gi;
      const intensifierMatches = text.match(intensifiers);
      if (intensifierMatches) rating += 1;
      
      rating = Math.min(rating, 10); // Cap at 10
      
      dangerPoints.push({
        title: risk.category,
        description: `Found ${matches.length} instances of ${risk.category.toLowerCase()} terms. ${getRiskDescription(risk.category, rating)}`,
        rating: rating,
        matches: matches.slice(0, 5) // Show first 5 matches
      });
    }
  });

  // Sort by danger rating (highest first)
  dangerPoints.sort((a, b) => b.rating - a.rating);
  
  return dangerPoints;
}

// Get risk description based on category and rating
function getRiskDescription(category, rating) {
  const descriptions = {
    "Financial Risk": rating >= 8 ? "High financial liability risk - potential for significant monetary loss" : 
                    rating >= 6 ? "Moderate financial risk - possible fees or penalties" : 
                    "Low financial risk - standard terms",
    "Privacy Risk": rating >= 8 ? "Critical privacy concern - extensive data collection and sharing" :
                   rating >= 6 ? "Significant privacy risk - personal data may be collected" :
                   "Low privacy risk - minimal data collection",
    "Service Risk": rating >= 8 ? "High service risk - limited support and guarantees" :
                   rating >= 6 ? "Moderate service risk - standard support terms" :
                   "Low service risk - good support terms",
    "Restriction Risk": rating >= 8 ? "Severe restrictions - very limited usage rights" :
                      rating >= 6 ? "Moderate restrictions - some usage limitations" :
                      "Low restrictions - reasonable usage terms",
    "Subscription Risk": rating >= 8 ? "High subscription risk - automatic renewals and charges" :
                       rating >= 6 ? "Moderate subscription risk - recurring billing" :
                       "Low subscription risk - clear billing terms",
    "Legal Protection": rating >= 8 ? "Extreme legal protection for provider - very limited user rights" :
                      rating >= 6 ? "Strong legal protection - limited user recourse" :
                      "Standard legal protection",
    "Legal Process": rating >= 8 ? "Complex legal process - arbitration required, limited court access" :
                   rating >= 6 ? "Moderate legal process - some dispute resolution options" :
                   "Standard legal process",
    "Modification Risk": rating >= 8 ? "High modification risk - terms can change significantly" :
                      rating >= 6 ? "Moderate modification risk - some terms may change" :
                      "Low modification risk - stable terms"
  };
  
  return descriptions[category] || "Risk assessment completed";
}

// Handle user queries using Writer API
async function handleUserQuery(question, context, originalText) {
  try {
    console.log("Background: Handling user query");
    console.log("Question:", question);
    
    if ("Writer" in self) {
      console.log("Using Writer API for query response...");
      const writer = await self.Writer.create();
      
      const prompt = `Based on the following analyzed content, answer the user's question:

CONTEXT: ${context}

ORIGINAL TEXT: ${originalText}

USER QUESTION: ${question}

Please provide a helpful, accurate response based on the content analysis. If the question is about specific risks or dangers, reference the danger ratings and provide actionable advice.`;

      const response = await writer.generate(prompt, {
        maxLength: 500,
        temperature: 0.7
      });
      
      writer.destroy();
      return response;
    } else {
      // Fallback response
      return `I understand you're asking about: "${question}". However, the Writer API is not available to provide a detailed response. Please refer to the analysis above for information about this content.`;
    }
  } catch (error) {
    console.error("Query handling error:", error);
    return `I'm sorry, I couldn't process your question due to a technical error: ${error.message}`;
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
