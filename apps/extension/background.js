const DEFAULT_SERVER_URL = "http://localhost:4000";

const ADULT_DOMAINS = [
  "pornhub.com",
  "xvideos.com",
  "xnxx.com",
  "redtube.com",
  "youporn.com",
  "chaturbate.com",
  "livejasmin.com",
  "stripchat.com",
  "onlyfans.com",
  "cam4.com",
  "xhamster.com",
  "beeg.com",
  "spankbang.com"
];

const STREAMING_DOMAINS = [
  "netflix.com",
  "primevideo.com",
  "hotstar.com",
  "jiocinema.com",
  "twitch.tv",
  "disneyplus.com",
  "hulu.com",
  "max.com",
  "crunchyroll.com",
  "dailymotion.com",
  "vimeo.com"
];

const GAMING_DOMAINS = [
  "roblox.com",
  "poki.com",
  "crazygames.com",
  "steampowered.com",
  "epicgames.com",
  "discord.com",
  "krunker.io",
  "agar.io",
  "slither.io",
  "minecraft.net"
];

let cachedRules = {
  blockAdult: true,
  blockStreaming: true,
  blockGaming: false,
  scanChats: true,
  lockIncognito: true,
  customDomains: []
};

let bufferedEvents = [];
let localMetrics = {
  totalHours: 0,
  domainReach: 0,
  blocksCount: 0,
  alertsCount: 0,
  domainVisits: {},
  hourlyActivity: new Array(24).fill(0)
};

let temporaryBypasses = new Set();

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

function initializeExtension() {
  setupAlarms();
  checkIncognitoStatus();
  syncRules();
}

function setupAlarms() {
  chrome.alarms.create("heartbeat_alarm", { periodInMinutes: 0.5 });
  chrome.alarms.create("eod_sync_alarm", { periodInMinutes: 5 });
  chrome.alarms.create("rule_poll_alarm", { periodInMinutes: 2 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "heartbeat_alarm") {
    sendHeartbeat();
    flushBufferedEvents();
  } else if (alarm.name === "eod_sync_alarm") {
    syncEodReport();
  } else if (alarm.name === "rule_poll_alarm") {
    syncRules();
  }
});

function checkIncognitoStatus() {
  chrome.extension.isAllowedIncognitoAccess((isAllowed) => {
    chrome.storage.local.get(["rules", "deviceToken"], (data) => {
      const lockActive = data.rules ? data.rules.lockIncognito !== false : true;
      if (lockActive && !isAllowed) {
        logSecurityEvent({
          eventType: "INCOGNITO_ATTEMPT",
          source: "Chrome Security Audit",
          snippet: "Extension lacks Incognito permission while lockIncognito is active",
          severity: "WARNING",
          timestamp: new Date().toISOString()
        });
      }
    });
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.incognito) {
    chrome.storage.local.get(["rules"], (data) => {
      const lockActive = data.rules ? data.rules.lockIncognito !== false : true;
      if (lockActive) {
        chrome.tabs.update(tab.id, {
          url: chrome.runtime.getURL("incognito_lock.html")
        });

        logSecurityEvent({
          eventType: "INCOGNITO_ATTEMPT",
          source: "Incognito Tab Intercept",
          snippet: "Private browsing tab intercepted and locked",
          severity: "WARNING",
          timestamp: new Date().toISOString()
        });
      }
    });
  }
});

async function syncRules() {
  chrome.storage.local.get(["serverUrl", "deviceId", "deviceToken"], async (data) => {
    if (!data.deviceId || !data.deviceToken) return;

    const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
    try {
      const res = await fetch(`${serverUrl}/api/devices/${data.deviceId}/rules`, {
        headers: {
          Authorization: `Bearer ${data.deviceToken}`,
          "x-device-token": data.deviceToken
        }
      });

      if (!res.ok) return;

      const body = await res.json();
      if (body.rule) {
        cachedRules = body.rule;
        chrome.storage.local.set({ rules: body.rule });
        await applyDeclarativeRules(body.rule);
      }
    } catch (err) { }
  });
}

async function applyDeclarativeRules(rules) {
  const domainsToBlock = new Set();

  if (rules.blockAdult) {
    ADULT_DOMAINS.forEach((d) => domainsToBlock.add(d));
  }
  if (rules.blockStreaming) {
    STREAMING_DOMAINS.forEach((d) => domainsToBlock.add(d));
  }
  if (rules.blockGaming) {
    GAMING_DOMAINS.forEach((d) => domainsToBlock.add(d));
  }
  if (Array.isArray(rules.customDomains)) {
    rules.customDomains.forEach((d) => domainsToBlock.add(d.trim().toLowerCase()));
  }

  temporaryBypasses.forEach((bypassed) => {
    domainsToBlock.delete(bypassed);
  });

  const ruleList = Array.from(domainsToBlock);
  const newRules = ruleList.map((domain, idx) => ({
    id: idx + 1,
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

  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((r) => r.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: newRules
    });
  } catch (err) { }
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0 && details.url && !details.url.startsWith("chrome") && !details.url.startsWith("edge")) {
    handleNavigation(details.url);
  }
});

function handleNavigation(url) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;

    const currentHour = new Date().getHours();
    localMetrics.hourlyActivity[currentHour] = (localMetrics.hourlyActivity[currentHour] || 0) + 1;
    localMetrics.domainVisits[domain] = (localMetrics.domainVisits[domain] || 0) + 1;
    localMetrics.domainReach = Object.keys(localMetrics.domainVisits).length;

    let isBlocked = false;
    if (cachedRules.blockAdult && ADULT_DOMAINS.some((d) => domain.includes(d))) isBlocked = true;
    if (cachedRules.blockStreaming && STREAMING_DOMAINS.some((d) => domain.includes(d))) isBlocked = true;
    if (cachedRules.blockGaming && GAMING_DOMAINS.some((d) => domain.includes(d))) isBlocked = true;
    if (cachedRules.customDomains && cachedRules.customDomains.some((d) => domain.includes(d))) isBlocked = true;

    if (isBlocked) {
      localMetrics.blocksCount++;
      logSecurityEvent({
        eventType: "BLOCKED_DOMAIN",
        source: domain,
        snippet: `Blocked access attempt: ${url}`,
        severity: "CRITICAL",
        timestamp: new Date().toISOString()
      });
    } else {
      logSecurityEvent({
        eventType: "URL_VISIT",
        source: domain,
        snippet: url,
        severity: "SAFE",
        timestamp: new Date().toISOString()
      });
    }
  } catch { }
}

function logSecurityEvent(event) {
  bufferedEvents.push(event);
  if (bufferedEvents.length >= 10) {
    flushBufferedEvents();
  }
}

async function flushBufferedEvents() {
  if (bufferedEvents.length === 0) return;

  chrome.storage.local.get(["serverUrl", "deviceToken"], async (data) => {
    if (!data.deviceToken) return;

    const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
    const toSend = [...bufferedEvents];
    bufferedEvents = [];

    try {
      const res = await fetch(`${serverUrl}/api/extension/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.deviceToken}`,
          "x-device-token": data.deviceToken
        },
        body: JSON.stringify({ events: toSend })
      });

      if (!res.ok) {
        bufferedEvents.push(...toSend);
      }
    } catch (err) {
      bufferedEvents.push(...toSend);
    }
  });
}

async function sendHeartbeat() {
  chrome.storage.local.get(["serverUrl", "deviceToken"], async (data) => {
    if (!data.deviceToken) return;

    const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
    try {
      await fetch(`${serverUrl}/api/extension/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.deviceToken}`,
          "x-device-token": data.deviceToken
        },
        body: JSON.stringify({
          incognitoLocked: cachedRules.lockIncognito !== false
        })
      });
    } catch { }
  });
}

async function syncEodReport() {
  chrome.storage.local.get(["serverUrl", "deviceToken"], async (data) => {
    if (!data.deviceToken) return;

    const serverUrl = data.serverUrl || DEFAULT_SERVER_URL;
    const today = new Date().toISOString().split("T")[0];

    try {
      await fetch(`${serverUrl}/api/extension/eod-sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.deviceToken}`,
          "x-device-token": data.deviceToken
        },
        body: JSON.stringify({
          date: today,
          totalHours: Math.round((localMetrics.hourlyActivity.reduce((a, b) => a + b, 0) / 60) * 10) / 10,
          domainReach: localMetrics.domainReach,
          hourlyActivityJson: localMetrics.hourlyActivity,
          categoryBreakdownJson: {
            safe: localMetrics.hourlyActivity.reduce((a, b) => a + b, 0),
            warning: localMetrics.alertsCount,
            critical: localMetrics.blocksCount
          },
          blocksCount: localMetrics.blocksCount,
          alertsCount: localMetrics.alertsCount
        })
      });
    } catch { }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "FLAGGED_CONTENT") {
    localMetrics.alertsCount++;
    logSecurityEvent(msg.payload);
    sendResponse({ received: true });
  } else if (msg.type === "SEARCH_QUERY") {
    logSecurityEvent(msg.payload);
    sendResponse({ received: true });
  } else if (msg.type === "TEMPORARY_BYPASS" && msg.url) {
    try {
      const parsed = new URL(msg.url);
      temporaryBypasses.add(parsed.hostname);
      applyDeclarativeRules(cachedRules);
      setTimeout(() => {
        temporaryBypasses.delete(parsed.hostname);
        applyDeclarativeRules(cachedRules);
      }, 15 * 60 * 1000);
    } catch { }
    sendResponse({ bypassed: true });
  } else if (msg.type === "MANUAL_SYNC") {
    syncRules().then(() => sendHeartbeat()).then(() => flushBufferedEvents()).then(() => syncEodReport());
    sendResponse({ triggered: true });
  }
  return true;
});
