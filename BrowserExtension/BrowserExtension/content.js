// Observe Gmail DOM and extract counts
function extractGmailCounts() {
  let inboxCount = 0;
  let sentCount = 0;

  document.querySelectorAll("a, div, span").forEach(el => {
    const text = el.innerText?.trim();
    const ariaLabel = el.getAttribute("aria-label")?.trim();

    // Inbox
    if (/^Inbox/i.test(text) || (ariaLabel && ariaLabel.startsWith("Inbox"))) {
      const num = (text.match(/(\d[\d,]*)/) || (ariaLabel && ariaLabel.match(/(\d[\d,]*)/)));
      if (num) inboxCount = parseInt(num[1].replace(/,/g, ""));
    }

    // Sent
    if (/^Sent/i.test(text) || (ariaLabel && ariaLabel.startsWith("Sent"))) {
      const num = (text.match(/(\d[\d,]*)/) || (ariaLabel && ariaLabel.match(/(\d[\d,]*)/)));
      if (num) sentCount = parseInt(num[1].replace(/,/g, ""));
    }
  });

  const total = inboxCount + sentCount;

  // Save counts in Chrome storage
  chrome.storage.local.set({ inboxCount, sentCount, total }, () => {
    console.log("📧 Gmail counts updated:", { inboxCount, sentCount, total });
  });
}

// Observe DOM changes in Gmail to auto-update counts
function startObserver() {
  const observer = new MutationObserver(() => extractGmailCounts());
  observer.observe(document.body, { childList: true, subtree: true });
  console.log("👀 Gmail DOM observer active.");

  // Initial delayed scans
  setTimeout(extractGmailCounts, 2000);
  setTimeout(extractGmailCounts, 5000);
}

// Start observer once DOM is ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  startObserver();
} else {
  window.addEventListener("load", startObserver);
}
