document.addEventListener("DOMContentLoaded", () => {
  const fetchBtn = document.getElementById("fetch");
  const dashboardBtn = document.getElementById("dashboard");
  const inboxCount = document.getElementById("inbox");
  const sentCount = document.getElementById("sent");
  const totalCount = document.getElementById("total");
  const co2 = document.getElementById("co2");
  const energy = document.getElementById("energy");
  const lastUpdated = document.getElementById("lastUpdated");

  // ---- Open dashboard page ----
  dashboardBtn.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });

  // ---- Fetch Gmail Data ----
  fetchBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "fetchEmails" }, res => {
      console.log("📬 Fetch complete:", res);
      loadStats();
    });
  });

  // ---- Load Stats ----
  function loadStats() {
    chrome.storage.local.get(["gmailData", "stats", "inboxCount", "sentCount", "lastReset"], data => {
      let emails = data.gmailData || [];
      if (typeof emails === "string") {
        try {
          emails = JSON.parse(emails);
        } catch (err) {
          console.error("❌ Failed to parse gmailData JSON:", err);
          emails = [];
        }
      }

      // Count Inbox and Sent emails (prefer full gmailData)
      const inboxEmailsCount = emails.length ? emails.filter(e => e.type === "Inbox").length : data.inboxCount || 0;
      const sentEmailsCount = emails.length ? emails.filter(e => e.type === "Sent").length : data.sentCount || 0;
      const totalEmails = inboxEmailsCount + sentEmailsCount;

      inboxCount.textContent = inboxEmailsCount;
      sentCount.textContent = sentEmailsCount;
      totalCount.textContent = totalEmails;

      co2.textContent = (totalEmails * 0.004).toFixed(3) + " kg";
      energy.textContent = (totalEmails * 0.0003).toFixed(3) + " kWh";

      lastUpdated.textContent = data.stats?.timestamp
        ? new Date(data.stats.timestamp).toLocaleString()
        : "-";
    });
  }

  // ---- Daily Reset at 23:59 ----
  async function scheduleDailyReset() {
    const now = new Date();
    const millisTillMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0) - now;

    if (millisTillMidnight < 0) {
      // If it’s already past 23:59, reset tomorrow
      setTimeout(resetData, 24 * 60 * 60 * 1000);
    } else {
      setTimeout(() => {
        resetData();
        // Schedule again for next day
        scheduleDailyReset();
      }, millisTillMidnight);
    }
  }

  function resetData() {
    console.log("🕛 Resetting Gmail data at 23:59...");
    chrome.storage.local.set({
      gmailData: "[]",
      inboxCount: 0,
      sentCount: 0,
      stats: { timestamp: new Date().toISOString() },
      lastReset: new Date().toISOString()
    }, () => {
      loadStats();
      console.log("✅ Gmail stats reset complete.");
    });
  }

  // ---- Load stats when popup opens ----
  loadStats();
  scheduleDailyReset();
});
