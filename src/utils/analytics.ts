
// Simple localStorage-based lifetime usage counters
export function incrementMergeCount(fileCount: number) {
  const currentMerges = parseInt(localStorage.getItem('totalMergesEver') || '0');
  const currentFiles = parseInt(localStorage.getItem('totalFilesProcessedEver') || '0');
  
  localStorage.setItem('totalMergesEver', (currentMerges + 1).toString());
  localStorage.setItem('totalFilesProcessedEver', (currentFiles + fileCount).toString());
  
  console.log(`Updated lifetime stats: ${currentMerges + 1} merges, ${currentFiles + fileCount} files`);
}

export function getLifetimeStats() {
  return {
    totalMerges: parseInt(localStorage.getItem('totalMergesEver') || '0'),
    totalFiles: parseInt(localStorage.getItem('totalFilesProcessedEver') || '0')
  };
}
