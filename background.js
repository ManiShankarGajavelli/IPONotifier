// Create an alarm when the extension starts
chrome.runtime.onStartup.addListener(() => {
    createAlarm();
});

// Also create an alarm when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
    createAlarm();
});

// Function to create or update the alarm
async function createAlarm() {
    const data = await chrome.storage.local.get('settings');
    const settings = data.settings || { checkInterval: 2 };
    
    // Clear any existing alarms
    chrome.alarms.clearAll();
    
    // Create new alarm
    chrome.alarms.create('ipoCheck', {
        periodInMinutes: settings.checkInterval * 60 // Convert hours to minutes
    });
    
    console.log(`Alarm set to check every ${settings.checkInterval} hours`);
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'ipoCheck') {
        checkIPOConditions();
    }
});

// Rest of your existing checkIPOConditions and other functions...
function isWithinMarketHours(settings) {
    const now = new Date();
    const day = now.getDay();
       console.log('Current day:', day, '(0 = Sunday, 6 = Saturday)');
    // Check if it's a weekday (1-5, Monday-Friday)
    if (day === 0 || day === 6) {
		console.log('Not a weekday, returning false');
		return false;
	}

    const currentTime = now.getHours() * 100 + now.getMinutes();
    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.endTime.split(':').map(Number);
    
    const startTime = startHour * 100 + startMinute;
    const endTime = endHour * 100 + endMinute;
      
    console.log('Current time:', currentTime);
    console.log('Start time:', startTime);
    console.log('End time:', endTime);
    console.log('Is within market hours:', currentTime >= startTime && currentTime <= endTime);
    
    return currentTime >= startTime && currentTime <= endTime;
}

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

function setCloseDateToEndOfDay(closeDate) {
  // Create a copy of the closeDate to avoid modifying the original object
  const closeDateCopy = new Date(closeDate); 

  // Set hours, minutes, and seconds to 23:59:59
  closeDateCopy.setHours(23, 59, 59, 999); // 999 milliseconds for maximum precision

  return closeDateCopy;
}

async function checkIPOConditions() {
	   console.log('Checking IPO conditions...');
    const data = await chrome.storage.local.get(['settings', 'ipoData']);
	   console.log('Retrieved settings:', data.settings);
    console.log('Retrieved IPO data:', data.ipoData);
    
    const settings = data.settings || {
        minListingPercent: 25,
        checkInterval: 0.02,
        startTime: '06:00',
        endTime: '16:00'
    };
    
    if (!isWithinMarketHours(settings)){
		  console.log('Outside market hours, skipping check');
		return;
	}

    const ipoData = data.ipoData || [];
    const today = new Date();

    ipoData.forEach(ipo => {
        const openDate = parseDate(ipo.Open);
        const closeDate = parseDate(ipo.Close);
        
        if (!openDate || !closeDate) return;

        // Check if current date is within IPO dates
        if (today >= openDate && today <= setCloseDateToEndOfDay(closeDate)) {
            // Extract listing percentage from string like "169 (14.97%)"
            const match = ipo['Est Listing'].match(/\((.*?)%\)/);
            if (!match) return;

            const estListingPercent = parseFloat(match[1]);
            if (estListingPercent >= settings.minListingPercent) {
                // Show notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon48.png',
                    title: 'IPO Alert!',
                    message: `${ipo.IPO} has an estimated listing gain of ${estListingPercent}%!`
                });
            }
        }
    });
}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
        createAlarm(); // Update alarm when settings change
    }
});

// Run initial check
console.log('Extension initialized');
checkIPOConditions();