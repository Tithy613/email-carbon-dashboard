// Constants
const ENERGY_PER_EMAIL_KWH = 0.0000002 * 75; // 75 KB per email
const CO2_PER_KWH = 475; // gCO₂ per kWh

// Show today's date
document.getElementById("today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  year: "numeric",
  month: "short",
  day: "numeric",
});

// Update popup with counts and carbon calculations
function updatePopup() {
  chrome.storage.local.get(["inboxCount", "sentCount", "total"], data => {
    const inbox = data.inboxCount || 0;
    const sent = data.sentCount || 0;
    const total = data.total || inbox + sent;

    document.getElementById("inbox").textContent = inbox;
    document.getElementById("sent").textContent = sent;
    document.getElementById("total").textContent = total;

    const energy = total * ENERGY_PER_EMAIL_KWH;
    const co2 = (energy * CO2_PER_KWH) / 1000; // convert g → kg

    document.getElementById("energy").textContent = energy.toFixed(5);
    document.getElementById("co2").textContent = co2.toFixed(5);
  });
}

// Refresh every 5 seconds
updatePopup();
setInterval(updatePopup, 5000);
