// content.js - SPA-safe Gmail counter

function safeExtractGmailCounts() {
  try {
    let inboxCount = 0;
    let sentCount = 0;

    document.querySelectorAll("a, span, div").forEach(el => {
      const text = el.innerText?.trim();
      const ariaLabel = el.getAttribute("aria-label")?.trim();

      // Inbox
      if (/^Inbox/i.test(text) || (ariaLabel && ariaLabel.startsWith("Inbox"))) {
        const num = (text?.match(/(\d[\d,]*)/) || ariaLabel?.match(/(\d[\d,]*)/));
        if (num) inboxCount = parseInt(num[1].replace(/,/g, ""));
      }

      // Sent
      if (/^Sent/i.test(text) || (ariaLabel && ariaLabel.startsWith("Sent"))) {
        const num = (text?.match(/(\d[\d,]*)/) || ariaLabel?.match(/(\d[\d,]*)/));
        if (num) sentCount = parseInt(num[1].replace(/,/g, ""));
      }
    });

    // Only set storage if chrome API is available
    if (chrome?.storage?.local) {
      chrome.storage.local.set({ inboxCount, sentCount, total: inboxCount + sentCount });
    }
  } catch (err) {
    console.warn("⚠️ Gmail DOM extraction failed (ignored):", err);
  }
}

// Run once after page load
window.addEventListener("load", safeExtractGmailCounts);

// Observe DOM mutations to catch dynamic changes (SPA-safe)
let observer;
try {
  observer = new MutationObserver(safeExtractGmailCounts);
  observer.observe(document.body, { childList: true, subtree: true });
} catch (err) {
  console.warn("⚠️ Gmail MutationObserver failed:", err);
}

// SPA-safe interval for fallback counting (every 10 seconds)
let interval;
try {
  interval = setInterval(safeExtractGmailCounts, 10000);
} catch (err) {
  console.warn("⚠️ Gmail interval failed:", err);
}
