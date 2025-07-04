
// Simple localStorage-based lifetime usage counters
export function incrementFileCount(fileCount: number) {
  const currentFiles = parseInt(localStorage.getItem('totalFilesProcessedEver') || '115');
  const newTotal = currentFiles + fileCount;
  
  localStorage.setItem('totalFilesProcessedEver', newTotal.toString());
  
  console.log(`Updated lifetime stats: ${newTotal} files processed`);
}

export function getLifetimeStats() {
  return {
    totalFiles: parseInt(localStorage.getItem('totalFilesProcessedEver') || '115')
  };
}
