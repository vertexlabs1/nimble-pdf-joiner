import React from 'react';
import { FileText, Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyFiles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Files</h1>
          <p className="text-muted-foreground">Manage your uploaded PDF documents</p>
        </div>
        <Button className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload PDF
        </Button>
      </div>

      {/* Empty State */}
      <div className="bg-card rounded-xl p-12 border shadow-sm text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
            <FolderOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">No files yet</h3>
          <p className="text-muted-foreground">
            Upload your first PDF to get started with our powerful tools
          </p>
          <Button className="mt-4">
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First PDF
          </Button>
        </div>
      </div>
    </div>
  );
}