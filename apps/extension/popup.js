// Bastiodon Extension Popup logic
document.addEventListener("DOMContentLoaded", async () => {
  const pairedView = document.getElementById("pairedView");
  const unpairedView = document.getElementById("unpairedView");
  const displayChildName = document.getElementById("displayChildName");
  const displayIncognitoStatus = document.getElementById("displayIncognitoStatus");
  const messageBox = document.getElementById("messageBox");

  const pairingCodeInput = document.getElementById("pairingCodeInput");
  const backendUrlInput = document.getElementById("backendUrlInput");
  const btnPairDevice = document.getElementById("btnPairDevice");

  const parentPinInput = document.getElementById("parentPinInput");
  const btnUnpairDevice = document.getElementById("btnUnpairDevice");

  function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = `alert ${isError ? "alert-error" : "alert-success"}`;
    messageBox.classList.remove("hidden");
    setTimeout(() => {
      messageBox.classList.add("hidden");
    }, 4000);
  }

  // Load storage state
  chrome.storage.local.get(["deviceToken", "childName", "backendUrl", "deviceId", "incognitoBlocked"], (data) => {
    if (data.backendUrl) {
      backendUrlInput.value = data.backendUrl;
    }

    if (data.deviceToken && data.deviceId) {
      pairedView.classList.remove("hidden");
      unpairedView.classList.add("hidden");
      displayChildName.textContent = data.childName || "Child Device";
      displayIncognitoStatus.textContent = data.incognitoBlocked ? "Enforced & Monitored" : "Disabled";
    } else {
      pairedView.classList.add("hidden");
      unpairedView.classList.remove("hidden");
    }
  });

  // Handle pairing button
  btnPairDevice.addEventListener("click", async () => {
    const code = pairingCodeInput.value.trim().toUpperCase();
    const serverUrl = backendUrlInput.value.trim().replace(/\/$/, "");

    if (!code || code.length < 5) {
      showMessage("Please enter a valid 6-character Pairing Code.", true);
      return;
    }

    btnPairDevice.disabled = true;
    btnPairDevice.textContent = "Connecting to Server...";

    try {
      const response = await fetch(`${serverUrl}/api/extension/pair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingCode: code })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Pairing failed. Check pairing code.");
      }

      // Save credentials in extension storage
      chrome.storage.local.set({
        deviceToken: resData.deviceToken,
        deviceId: resData.deviceId,
        parentId: resData.parentId,
        childName: resData.childName,
        backendUrl: serverUrl,
        incognitoBlocked: resData.incognitoBlocked
      }, () => {
        showMessage("Device paired successfully! Bastiodon is now active.");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });

      // Send message to background script to sync rules and connect socket
      chrome.runtime.sendMessage({ type: "SYNC_RULES" });
    } catch (err) {
      showMessage(err.message || "Could not connect to server.", true);
    } finally {
      btnPairDevice.disabled = false;
      btnPairDevice.textContent = "Link Device to Parent Portal";
    }
  });

  // Handle tamper-protected unpair button
  btnUnpairDevice.addEventListener("click", async () => {
    const pin = parentPinInput.value.trim();
    if (!pin) {
      showMessage("Enter Parent Master PIN to unpair device.", true);
      return;
    }

    btnUnpairDevice.disabled = true;
    btnUnpairDevice.textContent = "Verifying PIN...";

    chrome.storage.local.get(["backendUrl", "deviceToken"], async (data) => {
      const serverUrl = data.backendUrl || "http://localhost:4000";
      try {
        const response = await fetch(`${serverUrl}/api/extension/verify-pin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.deviceToken}`
          },
          body: JSON.stringify({ pin })
        });

        const resData = await response.json();
        if (response.ok && resData.valid) {
          // Clear credentials
          chrome.storage.local.clear(() => {
            showMessage("Device unlinked successfully.");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          });
        } else {
          showMessage("Invalid Parent PIN. Access Denied.", true);
        }
      } catch (err) {
        showMessage("Failed to verify PIN. Check server connection.", true);
      } finally {
        btnUnpairDevice.disabled = false;
        btnUnpairDevice.textContent = "Unlock & Unpair Device";
      }
    });
  });
});

