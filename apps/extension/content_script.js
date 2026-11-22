// Bastiodon Content Script: Real-time DOM text, Search Query & In-Game/Web Chat Scanner
(function () {
  console.log("[Bastiodon Guardian] Content script loaded and active.");

  const DANGEROUS_PATTERNS = [
    { pattern: /\bsuicide\b/i, severity: "CRITICAL_ILLEGAL", type: "SELF_HARM" },
    { pattern: /\bkill\s+yourself\b/i, severity: "CRITICAL_ILLEGAL", type: "HARASSMENT_THREAT" },
    { pattern: /\bbuy\s+drugs\b/i, severity: "CRITICAL_ILLEGAL", type: "ILLICIT_SUBSTANCE" },
    { pattern: /\bchild\s+porn\b/i, severity: "CRITICAL_ILLEGAL", type: "CSAM_ILLEGAL" },
    { pattern: /\bmake\s+a\s+bomb\b/i, severity: "CRITICAL_ILLEGAL", type: "WEAPONS_TERROR" },
    { pattern: /\bsend\s+nudes\b/i, severity: "CRITICAL_ILLEGAL", type: "SEXUAL_SOLICITATION" },
    { pattern: /\bhate\s+you\s+die\b/i, severity: "WARNING", type: "CYBERBULLYING" },
    { pattern: /\bwhat\s+is\s+your\s+address\b/i, severity: "WARNING", type: "PRIVACY_RISK" },
    { pattern: /\bare\s+you\s+home\s+alone\b/i, severity: "WARNING", type: "PREDATORY_GROOMING" },
    { pattern: /\bmeet\s+me\s+in\s+private\b/i, severity: "WARNING", type: "PREDATORY_GROOMING" },
    { pattern: /\bcheat\s+code\s+hack\b/i, severity: "WARNING", type: "MALWARE_RISK" }
  ];

  let scannedSnippetsCache = new Set();

  function scanText(text, contextType = "WEB_MESSAGE") {
    if (!text || typeof text !== "string" || text.trim().length < 3) return;
    const cleanText = text.trim();
    if (scannedSnippetsCache.has(cleanText)) return;

    for (const item of DANGEROUS_PATTERNS) {
      if (item.pattern.test(cleanText)) {
        scannedSnippetsCache.add(cleanText);
        console.warn(`[Bastiodon Scanner] Flagged content (${item.severity}):`, cleanText);

        chrome.runtime.sendMessage({
          type: "FLAGGED_CONTENT",
          payload: {
            url: window.location.href,
            domain: window.location.hostname,
            contentType: contextType,
            snippet: cleanText.length > 200 ? cleanText.substring(0, 200) + "..." : cleanText,
            severity: item.severity,
            actionTaken: item.severity === "CRITICAL_ILLEGAL" ? "BLOCKED" : "FLAGGED"
          }
        });
        break;
      }
    }
  }

  // 1. Monitor Input Fields, Textareas, and ContentEditable (Chatboxes in Roblox, Discord, Web Games)
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
      // Determine if within gaming or messaging context
      const isGamingChat = window.location.hostname.includes("roblox.com") ||
        window.location.hostname.includes("poki.com") ||
        window.location.hostname.includes("crazygames.com") ||
        window.location.hostname.includes("krunker.io") ||
        window.location.hostname.includes("discord.com");

      scanText(text, isGamingChat ? "IN_GAME_CHAT" : "WEB_MESSAGE");
    }
  }, { passive: true });

  // 2. Scan Search Engine Queries
  const searchParams = new URLSearchParams(window.location.search);
  const searchQuery = searchParams.get("q") || searchParams.get("query") || searchParams.get("p");
  if (searchQuery) {
    chrome.runtime.sendMessage({
      type: "SEARCH_QUERY",
      payload: {
        url: window.location.href,
        domain: window.location.hostname,
        contentType: "SEARCH_QUERY",
        snippet: `Search: "${searchQuery}"`,
        severity: "SAFE",
        actionTaken: "ALLOWED"
      }
    });
    scanText(searchQuery, "SEARCH_QUERY");
  }

  // 3. Scan dynamic mutations (incoming messages in web chat / gaming)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          scanText(node.nodeValue, "WEB_MESSAGE");
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          // Check if message container (e.g., chat log)
          const text = (node.innerText || "").trim();
          if (text.length > 5 && text.length < 300) {
            scanText(text, "WEB_MESSAGE");
          }
        }
      }
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();

