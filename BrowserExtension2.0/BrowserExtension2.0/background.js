// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("🌿 Email Carbon Calculator installed!");
});

// Get OAuth token
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError || !token) reject(chrome.runtime.lastError);
      else resolve(token);
    });
  });
}

// Helper: delay
function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Fetch all messages from a Gmail label (Inbox or Sent) with pagination
async function fetchAllEmails(label) {
  const token = await getAuthToken();
  let allMessages = [];
  let pageToken = null;
  let batch = 1;

  do {
    const url = new URL("https://www.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set("labelIds", label);
    url.searchParams.set("maxResults", "100");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();

    const msgs = data.messages || [];
    allMessages = allMessages.concat(msgs);
    console.log(`Fetched batch ${batch} (${msgs.length} messages) for label ${label}`);

    pageToken = data.nextPageToken;
    batch++;

    // Wait 2 sec before next batch
    if (pageToken) await delay(2000);

  } while (pageToken);

  console.log(`✅ Total ${allMessages.length} messages fetched for label ${label}`);
  return allMessages;
}

// Fetch message details and format them
async function fetchMessageDetails(msgs) {
  const token = await getAuthToken();
  const detailedMessages = [];

  for (const msg of msgs) {
    try {
      const msgResp = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const msgData = await msgResp.json();

      if (!msgData.payload || !msgData.payload.headers) {
        console.warn(`⚠️ Skipping message ${msg.id}: payload or headers missing`);
        continue;
      }

      const headers = msgData.payload.headers;
      const getHeader = name => headers.find(h => h.name === name)?.value || "N/A";

      const isSent = msgData.labelIds.includes("SENT");
      const emailAddress = isSent ? getHeader("To") : getHeader("From");

      detailedMessages.push({
        id: emailAddress,
        date: getHeader("Date"),
        type: isSent ? "Sent" : "Inbox"
      });

    } catch (err) {
      console.error("❌ Error fetching message:", err);
    }
  }

  return detailedMessages;
}

// Main function to fetch and save emails
async function fetchEmails() {
  try {
    const inboxMsgs = await fetchAllEmails("INBOX");
    const sentMsgs  = await fetchAllEmails("SENT");

    console.log(`Fetched ${inboxMsgs.length} Inbox messages`);
    console.log(`Fetched ${sentMsgs.length} Sent messages`);

    const allMsgs = await fetchMessageDetails([...inboxMsgs, ...sentMsgs]);

    // Save array directly (not stringified) to local storage
    chrome.storage.local.set({
      gmailData: allMsgs,
      stats: { totalEmails: allMsgs.length, timestamp: new Date().toISOString() }
    }, () => {
      console.log("✅ All emails fetched and saved to local storage");
    });

  } catch (err) {
    console.error("❌ Error fetching emails:", err);
  }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "ping") sendResponse({ alive: true });
  if (msg.action === "fetchEmails") {
    fetchEmails().then(() => sendResponse({ status: "ok" }));
    return true; // keep port open
  }
});
