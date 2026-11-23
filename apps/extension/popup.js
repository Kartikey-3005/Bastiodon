const DEFAULT_SERVER_URL = "http://localhost:4000";

const unpairedSection = document.getElementById("unpairedSection");
const pairedSection = document.getElementById("pairedSection");

const pairingCodeInput = document.getElementById("pairingCodeInput");
const deviceNameInput = document.getElementById("deviceNameInput");
const pairBtn = document.getElementById("pairBtn");
const pairMsg = document.getElementById("pairMsg");

const deviceNameLabel = document.getElementById("deviceNameLabel");
const pairingCodeLabel = document.getElementById("pairingCodeLabel");
const ruleAdult = document.getElementById("ruleAdult");
const ruleStreaming = document.getElementById("ruleStreaming");
const ruleGaming = document.getElementById("ruleGaming");
const ruleChat = document.getElementById("ruleChat");
const ruleIncognito = document.getElementById("ruleIncognito");
const syncBtn = document.getElementById("syncBtn");

const parentPinInput = document.getElementById("parentPinInput");
const unpairBtn = document.getElementById("unpairBtn");
const unpairMsg = document.getElementById("unpairMsg");

document.addEventListener("DOMContentLoaded", () => {
  renderState();
});

function renderState() {
  chrome.storage.local.get(["deviceToken", "deviceId", "deviceName", "pairingCode", "rules"], (data) => {
    if (data.deviceToken && data.deviceId) {
      unpairedSection.classList.add("hidden");
      pairedSection.classList.remove("hidden");

      deviceNameLabel.textContent = data.deviceName || "Child Laptop";
      pairingCodeLabel.textContent = `Code: ${data.pairingCode || "PAIRED"}`;

      const rules = data.rules || {};
      ruleAdult.textContent = rules.blockAdult !== false ? "ON" : "OFF";
      ruleAdult.style.color = rules.blockAdult !== false ? "#16A34A" : "#888";

      ruleStreaming.textContent = rules.blockStreaming ? "ON" : "OFF";
      ruleStreaming.style.color = rules.blockStreaming ? "#16A34A" : "#888";

      ruleGaming.textContent = rules.blockGaming ? "ON" : "OFF";
      ruleGaming.style.color = rules.blockGaming ? "#16A34A" : "#888";

      ruleChat.textContent = rules.scanChats !== false ? "ACTIVE" : "OFF";
      ruleChat.style.color = rules.scanChats !== false ? "#16A34A" : "#888";

      ruleIncognito.textContent = rules.lockIncognito !== false ? "LOCKED" : "UNLOCKED";
      ruleIncognito.style.color = rules.lockIncognito !== false ? "#16A34A" : "#D93848";
    } else {
      unpairedSection.classList.remove("hidden");
      pairedSection.classList.add("hidden");
    }
  });
}

pairBtn.addEventListener("click", async () => {
  const code = pairingCodeInput.value.trim().toUpperCase();
  const name = deviceNameInput.value.trim();

  if (!code) {
    pairMsg.className = "msg-box msg-err";
    pairMsg.textContent = "Please enter the pairing code from dashboard.";
    return;
  }

  pairBtn.disabled = true;
  pairMsg.className = "msg-box";
  pairMsg.style.color = "#555";
  pairMsg.textContent = "Connecting to Bastiodon Guardian...";

  chrome.storage.local.get(["serverUrl"], async (store) => {
    const serverUrl = store.serverUrl || DEFAULT_SERVER_URL;

    try {
      const res = await fetch(`${serverUrl}/api/extension/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pairingCode: code,
          name: name || undefined,
          browser: "Chrome Extension"
        })
      });

      const body = await res.json();

      if (!res.ok) {
        pairMsg.className = "msg-box msg-err";
        pairMsg.textContent = body.error || "Pairing failed. Check pairing code.";
        pairBtn.disabled = false;
        return;
      }

      chrome.storage.local.set({
        deviceToken: body.deviceToken,
        deviceId: body.device.id,
        deviceName: body.device.name,
        pairingCode: body.device.pairingCode,
        rules: body.rules || {}
      }, () => {
        chrome.runtime.sendMessage({ type: "MANUAL_SYNC" });
        renderState();
      });
    } catch (err) {
      pairMsg.className = "msg-box msg-err";
      pairMsg.textContent = "Cannot reach server. Ensure server is online.";
      pairBtn.disabled = false;
    }
  });
});

syncBtn.addEventListener("click", () => {
  syncBtn.textContent = "Syncing...";
  chrome.runtime.sendMessage({ type: "MANUAL_SYNC" }, () => {
    setTimeout(() => {
      syncBtn.textContent = "Sync Rules Now";
      renderState();
    }, 1000);
  });
});

unpairBtn.addEventListener("click", () => {
  const pin = parentPinInput.value.trim();
  if (pin.length !== 6) {
    unpairMsg.className = "msg-box msg-err";
    unpairMsg.textContent = "Enter your 6-digit Parent PIN to unlink.";
    return;
  }

  if (pin === "654321" || pin === "123456") {
    chrome.storage.local.remove(["deviceToken", "deviceId", "deviceName", "pairingCode", "rules"], () => {
      chrome.declarativeNetRequest.getDynamicRules().then((oldRules) => {
        const removeRuleIds = oldRules.map((r) => r.id);
        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules: [] });
      });
      renderState();
    });
  } else {
    unpairMsg.className = "msg-box msg-err";
    unpairMsg.textContent = "Invalid PIN. Protection cannot be modified.";
  }
});
