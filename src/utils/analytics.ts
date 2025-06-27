
// Zapier webhook logging utility for tracking PDF merge usage
export async function logMergeActivity(fileCount: number, totalSizeMB: number, error = false) {
  // Don't attempt analytics if we don't have valid parameters
  if (fileCount <= 0 || totalSizeMB < 0) {
    console.log('Skipping analytics - invalid parameters:', { fileCount, totalSizeMB, error });
    return;
  }

  const ZAPIER_WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/12967732/ub5oyzh/";
  
  // Prepare payload for Zapier webhook
  const payload = {
    file_count: fileCount,
    total_size_mb: totalSizeMB,
    error: error,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    app_url: window.location.origin
  };

  console.log('Sending analytics data to Zapier:', payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(ZAPIER_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      mode: 'no-cors' // Zapier webhooks work well with no-cors
    });

    clearTimeout(timeoutId);
    console.log('Analytics data sent to Zapier successfully');
    
  } catch (err) {
    // Silently handle analytics failures - don't break the app
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.warn("Analytics request timed out");
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
