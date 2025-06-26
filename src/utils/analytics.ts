
// Google Apps Script endpoint URL - replace with your actual URL
const LOG_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

export const logPageVisit = async () => {
  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_count: 0,
        total_size: 0,
        event_type: 'page_visit'
      })
    });
    console.log('Page visit logged');
  } catch (error) {
    // Fail silently - don't show errors to users for analytics
    console.log('Analytics logging failed:', error);
  }
};

export const logMerge = async (fileCount: number, totalSizeMB: number) => {
  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_count: fileCount,
        total_size: totalSizeMB,
        event_type: 'merge_complete'
      })
    });
    console.log('Merge logged:', { fileCount, totalSizeMB });
  } catch (error) {
    // Fail silently - don't show errors to users for analytics
    console.log('Analytics logging failed:', error);
  }
};
