
// Google Apps Script logging utility for tracking PDF merge usage
export async function logMergeActivity(fileCount: number, totalSizeMB: number, error = false) {
  // Don't attempt analytics if we don't have valid parameters
  if (fileCount <= 0 || totalSizeMB < 0) {
    console.log('Skipping analytics - invalid parameters:', { fileCount, totalSizeMB, error });
    return;
  }

  const LOG_ENDPOINT = import.meta.env.PUBLIC_LOG_URL || "https://script.google.com/macros/s/AKfycbxC_KnCFTMcryLIBEzgAnaYrEG0vRLN38w2QTzxS7F5ZhOtT-8ggneM7PRJ9AtpEEckCg/exec";
  
  // Send data directly without the contents wrapper
  const payload = {
    file_count: fileCount,
    total_size: totalSizeMB,
    error: error // Send boolean instead of "Yes"/"No" string
  };

  console.log('Attempting to send analytics data:', payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(LOG_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      signal: controller.signal,
      mode: 'cors' // Explicitly set CORS mode
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Analytics request failed with status ${res.status}:`, res.statusText);
      return;
    }

    const result = await res.text();
    console.log('Analytics response:', result);
    
    if (result !== "Success") {
      console.warn("Analytics logging failed with response:", result);
    } else {
      console.log("Analytics logged successfully");
    }
  } catch (err) {
    // Silently handle analytics failures - don't break the app
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.warn("Analytics request timed out");
      } else if (err.message.includes('CORS')) {
        console.warn("Analytics blocked by CORS policy - this is expected in development");
      } else {
        console.warn("Analytics logging failed:", err.message);
      }
    } else {
      console.warn("Analytics logging failed with unknown error:", err);
    }
  }
}

// Helper function to calculate total file size in MB
export function calculateTotalSizeMB(files: File[]): number {
  if (!files || files.length === 0) return 0;
  const totalBytes = files.reduce((sum, file) => sum + (file?.size || 0), 0);
  return Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // Round to 2 decimal places
}
