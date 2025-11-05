document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["gmailData"], data => {
    let emails = data.gmailData || [];
    if (typeof emails === "string") {
      try {
        emails = JSON.parse(emails);
      } catch (err) {
        console.error("❌ Failed to parse gmailData:", err);
        return;
      }
    }

    if (!emails.length) {
      console.warn("⚠️ No emails found in local storage");
      document.getElementById("suggestion").textContent =
        "No email data found. Please fetch your Gmail data first.";
      return;
    }

    /* ---------- 📊 PIE CHART: Inbox vs Sent ---------- */
    const typeCounts = emails.reduce(
      (acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      },
      { Inbox: 0, Sent: 0 }
    );

    new Chart(document.getElementById("pieChart"), {
      type: "pie",
      data: {
        labels: ["Inbox", "Sent"],
        datasets: [
          {
            data: [typeCounts.Inbox, typeCounts.Sent],
            backgroundColor: ["#34a853", "#4285f4"],
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: { display: true, text: "Inbox vs Sent Email Distribution" },
        },
      },
    });

    /* ---------- 📈 LINE CHART: Inbox vs Sent per Day ---------- */
    const inboxCounts = {};
    const sentCounts = {};

    emails.forEach(e => {
      const day = new Date(e.date).toLocaleDateString("en-CA"); // YYYY-MM-DD
      if (e.type === "Inbox") inboxCounts[day] = (inboxCounts[day] || 0) + 1;
      else if (e.type === "Sent") sentCounts[day] = (sentCounts[day] || 0) + 1;
    });

    const allDays = [...new Set([...Object.keys(inboxCounts), ...Object.keys(sentCounts)])]
      .sort((a, b) => new Date(a) - new Date(b));

    const inboxData = allDays.map(d => inboxCounts[d] || 0);
    const sentData = allDays.map(d => sentCounts[d] || 0);

    new Chart(document.getElementById("barChart"), {
      type: "line",
      data: {
        labels: allDays,
        datasets: [
          {
            label: "Inbox Emails",
            data: inboxData,
            borderColor: "#34a853",
            backgroundColor: "#34a85333",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Sent Emails",
            data: sentData,
            borderColor: "#4285f4",
            backgroundColor: "#4285f433",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: { display: true, text: "Emails per Day (Inbox vs Sent)" },
          legend: { position: "top" },
        },
        scales: {
          x: { title: { display: true, text: "Date" } },
          y: { beginAtZero: true, title: { display: true, text: "Email Count" } },
        },
      },
    });
    /* ---------- 📬 TOP SENDERS / RECEIVERS ---------- */
const senderCounts = {};
emails.forEach(e => {
  if (e.type === "Inbox") {
    // You can replace `e.id` with `e.from` if your email object has a sender field
    senderCounts[e.id] = (senderCounts[e.id] || 0) + 1;
  }
});

const topSenders = Object.entries(senderCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10); // Top 10 senders

// Helper: shorten long emails for display
const shortLabel = email => (email.length > 20 ? email.slice(0, 17) + "..." : email);

new Chart(document.getElementById("topSendersChart"), {
  type: "bar",
  data: {
    labels: topSenders.map(([email]) => shortLabel(email)),
    datasets: [
      {
        label: "Top Senders (Inbox)",
        data: topSenders.map(([, count]) => count),
        backgroundColor: "#ff9800",
      },
    ],
  },
  options: {
    responsive: false,
    plugins: {
      title: { display: true, text: "Top 10 Email Senders" },
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: tooltipItems => {
            const index = tooltipItems[0].dataIndex;
            return topSenders[index][0]; // full email on hover
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
          color: "#333",
          font: { size: 10 },
        },
        title: { display: true, text: "Sender Email" },
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: "Email Count" },
      },
    },
  },
});

    /* ---------- 🌍 CO₂ & ENERGY USAGE OVER TIME ---------- */
    const dailyEmails = {};
    emails.forEach(e => {
      const day = new Date(e.date).toLocaleDateString("en-CA");
      dailyEmails[day] = (dailyEmails[day] || 0) + 1;
    });

    const days = Object.keys(dailyEmails).sort((a, b) => new Date(a) - new Date(b));
    const dailyCO2 = days.map(d => dailyEmails[d] * 0.004);
    const dailyEnergy = days.map(d => dailyEmails[d] * 0.0003);

    new Chart(document.getElementById("impactChart"), {
      type: "line",
      data: {
        labels: days,
        datasets: [
          {
            label: "CO₂ Emissions (kg)",
            data: dailyCO2,
            borderColor: "#f44336",
            yAxisID: "y",
            fill: false,
          },
          {
            label: "Energy (kWh)",
            data: dailyEnergy,
            borderColor: "#ff9800",
            yAxisID: "y1",
            fill: false,
          },
        ],
      },
      options: {
        responsive: false,
        interaction: { mode: "index", intersect: false },
        stacked: false,
        plugins: {
          title: { display: true, text: "Daily Email Impact (CO₂ & Energy)" },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "CO₂ (kg)" },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            grid: { drawOnChartArea: false },
            title: { display: true, text: "Energy (kWh)" },
          },
        },
      },
    });

    /* ---------- 🌿 ECO SUGGESTION SYSTEM ---------- */
    const totalEmails = emails.length;
    const co2 = totalEmails * 0.004; // kg CO2
    const energy = totalEmails * 0.0003; // kWh

    let suggestion = "💡 Keep your inbox organized for better digital sustainability.";

    if (typeCounts.Inbox > 2000)
      suggestion = "🧹 You have over 2,000 emails! Consider cleaning up to reduce carbon footprint.";
    else if (typeCounts.Inbox > 1000)
      suggestion = "📬 Your inbox is crowded. Try deleting or archiving old emails.";
    else if (co2 > 1)
      suggestion = "🌍 Your email footprint exceeds 1 kg CO₂ — unsubscribe from unused newsletters!";
    else if (energy > 0.1)
      suggestion = "⚡ Try reducing email traffic to save energy and bandwidth.";
    else if (typeCounts.Inbox < 100)
      suggestion = "🌱 Great job! Your inbox is clean and eco-friendly.";

    document.getElementById("suggestion").textContent = suggestion;
  });
});
