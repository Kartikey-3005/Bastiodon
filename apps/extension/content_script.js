(function () {
  const DANGEROUS_PATTERNS = [
    { pattern: /\bsuicide\b/i, severity: "CRITICAL", type: "SELF_HARM" },
    { pattern: /\bkill\s+yourself\b/i, severity: "CRITICAL", type: "HARASSMENT_THREAT" },
    { pattern: /\bbuy\s+drugs\b/i, severity: "CRITICAL", type: "ILLICIT_SUBSTANCE" },
    { pattern: /\bchild\s+porn\b/i, severity: "CRITICAL", type: "CSAM_ILLEGAL" },
    { pattern: /\bmake\s+a\s+bomb\b/i, severity: "CRITICAL", type: "WEAPONS_TERROR" },
    { pattern: /\bsend\s+nudes\b/i, severity: "CRITICAL", type: "SEXUAL_SOLICITATION" },
    { pattern: /\bhate\s+you\s+die\b/i, severity: "WARNING", type: "CYBERBULLYING" },
    { pattern: /\bwhat\s+is\s+your\s+address\b/i, severity: "WARNING", type: "PRIVACY_RISK" },
    { pattern: /\bare\s+you\s+home\s+alone\b/i, severity: "WARNING", type: "PREDATORY_GROOMING" },
    { pattern: /\bmeet\s+me\s+in\s+private\b/i, severity: "WARNING", type: "PREDATORY_GROOMING" },
    { pattern: /\bwhere\s+do\s+you\s+live\b/i, severity: "WARNING", type: "PREDATORY_GROOMING" },
    { pattern: /\bsend\s+phone\s+number\b/i, severity: "WARNING", type: "PRIVACY_RISK" }
  ];

  const scannedSnippetsCache = new Set();

  function scanText(text, contextType = "CHAT_ALERT") {
    if (!text || typeof text !== "string" || text.trim().length < 3) return;
    const cleanText = text.trim();
    if (scannedSnippetsCache.has(cleanText)) return;

    for (const item of DANGEROUS_PATTERNS) {
      if (item.pattern.test(cleanText)) {
        scannedSnippetsCache.add(cleanText);

        chrome.runtime.sendMessage({
          type: "FLAGGED_CONTENT",
          payload: {
            eventType: "CHAT_ALERT",
            source: window.location.hostname,
            snippet: cleanText.length > 200 ? cleanText.substring(0, 200) + "..." : cleanText,
            severity: item.severity,
            timestamp: new Date().toISOString()
          }
        });
        break;
      }
    }
  }

  document.addEventListener("input", (e) => {
    const target = e.target;
    if (!target) return;

    let text = "";
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      text = target.value;
    } else if (target.isContentEditable) {
      text = target.innerText;
    }

    if (text) {
      scanText(text, "CHAT_ALERT");
    }
  }, { passive: true });

  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("q") || searchParams.get("query") || searchParams.get("p");
  if (searchQuery) {
    chrome.runtime.sendMessage({
      type: "SEARCH_QUERY",
      payload: {
        eventType: "SEARCH_ALERT",
        source: window.location.hostname,
        snippet: searchQuery,
        severity: "WARNING",
        timestamp: new Date().toISOString()
      }
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          scanText(node.nodeValue, "CHAT_ALERT");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const text = node.innerText;
          if (text && text.length < 300) {
            scanText(text, "CHAT_ALERT");
          }
        }
      }
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();
