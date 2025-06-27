
// Google Apps Script logging utility for tracking PDF merge usage
export async function logMergeActivity(fileCount: number, totalSizeMB: number, error = false) {
  const LOG_ENDPOINT = import.meta.env.PUBLIC_LOG_URL || "https://script.google.com/macros/s/AKfycbzuzU_D36YDFN4_6X0xU7drV7GcQW8l6fhQW6vF5jxekTXjJ4hrmVYMr1GPh6mKonW6mA/exec";
  
  // Send data directly without the contents wrapper
  const payload = {
    file_count: fileCount,
    total_size: totalSizeMB,
    error: error // Send boolean instead of "Yes"/"No" string
  };

  console.log('Sending analytics data:', payload);

  try {
    const res = await fetch(LOG_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload), // Send payload directly, not wrapped in contents
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await res.text();
    console.log('Analytics response:', result);
    
    if (result !== "Success") {
      console.warn("Logging failed with response:", result);
    } else {
      console.log("Analytics logged successfully");
    }
  } catch (err) {
    console.error("Analytics logging failed:", err);
  }
}

// Helper function to calculate total file size in MB
export function calculateTotalSizeMB(files: File[]): number {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  return Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // Round to 2 decimal places
}
