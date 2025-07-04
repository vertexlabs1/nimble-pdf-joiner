import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { getLifetimeStats } from '@/utils/analytics';

export const UsageStats = () => {
  const [stats, setStats] = useState({ totalFiles: 115 });

  useEffect(() => {
    const updateStats = () => {
      setStats(getLifetimeStats());
    };

    // Update stats on mount
    updateStats();

    // Update stats when localStorage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'totalFilesProcessedEver') {
        updateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="text-center mt-3">
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <FileText className="h-4 w-4 text-green-600" />
        <span>
          <span className="font-semibold text-green-700">{stats.totalFiles.toLocaleString()}</span>
          <span className="text-xs">*</span> files processed by our community
        </span>
      </div>
    </div>
  );
};