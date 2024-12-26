// Default settings
const DEFAULT_SETTINGS = {
    minListingPercent: 25,
    checkInterval: 0.02,
    startTime: '06:00',
    endTime: '16:00'
};

// Load settings and data when popup opens
document.addEventListener('DOMContentLoaded', async () => {
    // Load settings
    const settings = await chrome.storage.local.get('settings');
	console.log(settings);
    const currentSettings = DEFAULT_SETTINGS;
    
    // Populate settings fields
    document.getElementById('minListingPercent').value = currentSettings.minListingPercent;
    document.getElementById('checkInterval').value = currentSettings.checkInterval;
    document.getElementById('startTime').value = currentSettings.startTime;
    document.getElementById('endTime').value = currentSettings.endTime;

    // Load and display IPO data
    updateIpoTable();
});

// Save settings
document.getElementById('saveSettings').addEventListener('click', async () => {
    const settings = {
        minListingPercent: parseFloat(document.getElementById('minListingPercent').value),
        checkInterval: parseFloat(document.getElementById('checkInterval').value),
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value
    };

    await chrome.storage.local.set({ settings });
    alert('Settings saved!');
});

function getMonthIndex(monthName) {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return months.indexOf(monthName);
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    const [day, month] = dateStr.split('-');
    const year = new Date().getFullYear();
	const monthIndex = getMonthIndex(month);
    return new Date(year, monthIndex, parseInt(day));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    return date ? date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short'
    }) : '';
}

async function updateIpoTable() {
    const data = await chrome.storage.local.get('ipoData');
    const ipoData = data.ipoData || [];
	 await chrome.storage.local.set({ ipoData });
    const tbody = document.getElementById('ipoTableBody');
    tbody.innerHTML = '';

    ipoData.forEach(ipo => {
        const row = document.createElement('tr');
        //const estListingPercent = parseFloat(ipo['Est Listing'].match(/\((.*?)%\)/)[1]);
        const estListingPercent = parseFloat(ipo['Est Listing']?.match(/\((.*?)%\)/)?.[1] ?? "0");

        
        row.innerHTML = `
            <td>${ipo.IPO}</td>
            <td>₹${ipo.Price}</td>
            <td>${ipo['GMP(₹)']}</td>
            <td>${ipo['Est Listing']} ${estListingPercent >= 25 ? '🔥' : ''}</td>
            <td>${formatDate(ipo.Open)}</td>
            <td>${formatDate(ipo.Close)}</td>
            <td>${formatDate(ipo.Listing)}</td>
            <td>${ipo['GMP Updated']}</td>
        `;
        tbody.appendChild(row);
    });
}