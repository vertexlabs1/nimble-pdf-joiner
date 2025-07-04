import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { FileText, Zap } from 'lucide-react';
import { getLifetimeStats } from '@/utils/analytics';

export const UsageStats = () => {
  const [stats, setStats] = useState({ totalMerges: 0, totalFiles: 0 });

  useEffect(() => {
    const updateStats = () => {
      setStats(getLifetimeStats());
    };

    // Update stats on mount
    updateStats();

    // Update stats when localStorage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'totalMergesEver' || e.key === 'totalFilesProcessedEver') {
        updateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 backdrop-blur-sm shadow-lg">
      <div className="flex items-center justify-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-full">
            <Zap className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">{stats.totalMerges.toLocaleString()}</div>
            <div className="text-sm text-green-600 font-medium">PDFs Merged</div>
          </div>
        </div>
        
        <div className="h-8 w-px bg-gray-300"></div>
        
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">{stats.totalFiles.toLocaleString()}</div>
            <div className="text-sm text-blue-600 font-medium">Files Processed</div>
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          🎉 <span className="font-semibold">Join the community!</span> Help us reach our next milestone
        </p>
      </div>
    </Card>
  );
};