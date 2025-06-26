
// Google Apps Script logging utility for tracking PDF merge usage
export async function logMergeActivity(fileCount: number, totalSizeMB: number, error = false) {
  const LOG_ENDPOINT = import.meta.env.PUBLIC_LOG_URL || "https://script.google.com/macros/s/AKfycbzuzU_D36YDFN4_6X0xU7drV7GcQW8l6fhQW6vF5jxekTXjJ4hrmVYMr1GPh6mKonW6mA/exec";
  
  const payload = {
    contents: JSON.stringify({
      file_count: fileCount,
      total_size: totalSizeMB,
      error: error ? "Yes" : "No"
    })
  };

  try {
    const res = await fetch(LOG_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const result = await res.text();
    if (result !== "Success") {
      console.warn("Logging failed:", result);
    }
  } catch (err) {
    console.error("Merge log failed:", err);
  }
}

// Helper function to calculate total file size in MB
export function calculateTotalSizeMB(files: File[]): number {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  return Math.round((totalBytes / (1024 * 1024)) * 100) / 100; // Round to 2 decimal places
}
