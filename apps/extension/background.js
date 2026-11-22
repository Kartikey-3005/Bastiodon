// Bastiodon Guardian: Manifest V3 Background Service Worker
// Handles: Dynamic declarativeNetRequest blocking, Incognito lockdown, Live telemetry sync, and EOD reporting.

const DEFAULT_SERVER_URL = "http://localhost:4000";

// Maintain in-memory active rules
let cachedBlockedDomains = [];
let localEodMetrics = {
  screenTimeMinutes: 0,
  sitesVisited: 0,
  blockedAttempts: 0,
  flaggedMessages: 0,
  domainVisits: {}
};

// ----------------------------------------------------------------
// 1. INITIALIZATION & INCOGNITO ENFORCEMENT
// ----------------------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Bastiodon Guardian] Extension Installed / Updated.");
  checkIncognitoStatus();
  syncRules();
  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[Bastiodon Guardian] Extension Startup.");
  checkIncognitoStatus();
  syncRules();
});

// Check if extension is allowed in Incognito; if blocked by policy, enforce lock
function checkIncognitoStatus() {
  chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
    chrome.storage.local.get(["incognitoBlocked"], (data) => {
      const incognitoPolicyActive = data.incognitoBlocked !== false;
      if (incognitoPolicyActive && !isAllowed) {
        console.warn("[Bastiodon Guardian] Incognito access is NOT granted to the extension!");
      }
    });
  });
}

// Intercept tabs opened in incognito
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.incognito) {
    chrome.storage.local.get(["incognitoBlocked"], (data) => {
      if (data.incognitoBlocked !== false) {
        // Close or redirect incognito tab
        chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL("incognito_lock.html")
        });
      }
    });
  }
});

// ----------------------------------------------------------------
// 2. DYNAMIC NETWORK BLOCKING (declarativeNetRequest)
// ----------------------------------------------------------------
async function syncRules() {
  chrome.storage.local.get(["deviceToken", "backendUrl"], async (data) => {
    if (!data.deviceToken) {
      console.log("[Bastiodon Guardian] Device not paired. Skipping rule sync.");
      return;
    }

    const serverUrl = (data.backendUrl || DEFAULT_SERVER_URL).replace(/\/$/, "");
    try {
      const res = await fetch(`${serverUrl}/api/extension/rules`, {
        headers: { "Authorization": `Bearer ${data.deviceToken}` }
      });

      if (!res.ok) return;
      const resData = await res.json();
      cachedBlockedDomains = resData.activeBlockedDomains || [];

      // Update declarativeNetRequest dynamic rules
      const rules = cachedBlockedDomains.map((domain, index) => ({
        id: index + 1,
        priority: 1,
        action: {
          type: "redirect",
          redirect: {
            url: chrome.runtime.getURL(`blocked.html?url=https://${domain}`)
          }
        },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      }));

      // Get existing rule IDs to remove
      const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
      const removeRuleIds = oldRules.map(r => r.id);

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules: rules
      });

      console.log(`[Bastiodon Guardian] Updated ${rules.length} blocking rules.`);
    } catch (err) {
      console.error("[Bastiodon Guardian] Failed to sync rules:", err);
    }
  });
}

// ----------------------------------------------------------------
// 3. REAL-TIME NAVIGATION & TELEMETRY DISPATCH
// ----------------------------------------------------------------
chrome.webNavigation.onCommitted.addListener((details) => {
  // Main frame only
  if (details.frameId === 0 && details.url && !details.url.startsWith("chrome") && !details.url.startsWith("edge")) {
    handlePageNavigation(details.url);
  }
});

function handlePageNavigation(url) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    // Track metrics
    localEodMetrics.sitesVisited += 1;
    localEodMetrics.domainVisits[domain] = (localEodMetrics.domainVisits[domain] || 0) + 1;

    // Check if domain is blocked
    const isBlocked = cachedBlockedDomains.some(d => domain.includes(d) || d.includes(domain));
    if (isBlocked) {
      localEodMetrics.blockedAttempts += 1;
    }

    // Transmit telemetry event to backend
    sendTelemetryEvent({
      url,
      domain,
      contentType: "URL",
      snippet: url,
      severity: isBlocked ? "CRITICAL_ILLEGAL" : "SAFE",
      actionTaken: isBlocked ? "BLOCKED" : "ALLOWED"
    });
  } catch (err) {}
}

async function sendTelemetryEvent(payload) {
  chrome.storage.local.get(["deviceToken", "backendUrl"], async (data) => {
    if (!data.deviceToken) return;
    const serverUrl = (data.backendUrl || DEFAULT_SERVER_URL).replace(/\/$/, "");

    try {
      await fetch(`${serverUrl}/api/telemetry/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.deviceToken}`
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Offline fallback: keep silent or buffer
    }
  });
}

// ----------------------------------------------------------------
// 4. LISTEN FOR CONTENT SCRIPT MESSAGES
// ----------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_RULES") {
    syncRules();
    sendResponse({ ok: true });
  } else if (message.type === "FLAGGED_CONTENT") {
    localEodMetrics.flaggedMessages += 1;
    sendTelemetryEvent(message.payload);
    sendResponse({ ok: true });
  } else if (message.type === "SEARCH_QUERY") {
    sendTelemetryEvent(message.payload);
    sendResponse({ ok: true });
  }
  return true;
});

// ----------------------------------------------------------------
// 5. PERIODIC ALARMS: RULE SYNC & END-OF-DAY BATCH DISPATCH
// ----------------------------------------------------------------
function setupAlarms() {
  chrome.alarms.create("sync_rules_alarm", { periodInMinutes: 5 });
  chrome.alarms.create("eod_sync_alarm", { periodInMinutes: 15 });
  chrome.alarms.create("screen_time_tick", { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sync_rules_alarm") {
    syncRules();
  } else if (alarm.name === "screen_time_tick") {
    // Increment active screen time
    localEodMetrics.screenTimeMinutes += 1;
  } else if (alarm.name === "eod_sync_alarm") {
    flushEodBatchReport();
  }
});

async function flushEodBatchReport() {
  chrome.storage.local.get(["deviceToken", "backendUrl"], async (data) => {
    if (!data.deviceToken) return;
    const serverUrl = (data.backendUrl || DEFAULT_SERVER_URL).replace(/\/$/, "");

    const topDomains = Object.entries(localEodMetrics.domainVisits)
      .map(([domain, count]) => ({ domain, count, minutes: count * 2 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const payload = {
      date: new Date().toISOString().split("T")[0],
      totalScreenTimeMins: localEodMetrics.screenTimeMinutes,
      totalSitesVisited: localEodMetrics.sitesVisited,
      blockedAttemptsCount: localEodMetrics.blockedAttempts,
      flaggedMessagesCount: localEodMetrics.flaggedMessages,
      topDomains,
      categoryBreakdown: {
        safe: Math.max(0, localEodMetrics.sitesVisited - localEodMetrics.blockedAttempts),
        blocked: localEodMetrics.blockedAttempts,
        flagged: localEodMetrics.flaggedMessages
      }
    };

    try {
      await fetch(`${serverUrl}/api/reports/eod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.deviceToken}`
        },
        body: JSON.stringify(payload)
      });
      console.log("[Bastiodon Guardian] EOD summary synced to server.");
    } catch (err) {
      console.error("[Bastiodon Guardian] EOD sync error:", err);
    }
  });
}

