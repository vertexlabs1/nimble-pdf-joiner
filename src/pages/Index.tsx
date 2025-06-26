
import { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { FileList } from '@/components/FileList';
import { MergeButton } from '@/components/MergeButton';
import { SecurityCallout } from '@/components/SecurityCallout';
import { HowItWorks } from '@/components/HowItWorks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Zap, Lock, Eye, Download } from 'lucide-react';

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilesAdded = (newFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleReorder = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleRemove = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
              <Shield className="h-3 w-3 mr-1" />
              100% Private
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Lock className="h-3 w-3 mr-1" />
              No Uploads
            </Badge>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Secure PDF Merge Tool
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
            Merge multiple PDF files privately and securely - all processing happens in your browser
          </p>
          <p className="text-sm text-green-700 font-medium">
            ✓ Your files never leave your device ✓ No server uploads ✓ Complete privacy
          </p>
        </div>

        {/* Security Callout */}
        <div className="max-w-3xl mx-auto mb-8">
          <SecurityCallout />
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Upload Area */}
          <Card className="p-8">
            <PDFUploader onFilesAdded={handleFilesAdded} disabled={isLoading} />
          </Card>

          {/* File List */}
          {files.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold">
                    Uploaded Files ({files.length})
                  </h2>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <Eye className="h-3 w-3 mr-1" />
                    Processed locally
                  </Badge>
                </div>
                <button
                  onClick={handleClear}
                  className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                  disabled={isLoading}
                >
                  Clear All
                </button>
              </div>
              <FileList
                files={files}
                onReorder={handleReorder}
                onRemove={handleRemove}
                disabled={isLoading}
              />
            </Card>
          )}

          {/* Merge Button */}
          {files.length >= 2 && (
            <div className="text-center">
              <MergeButton
                files={files}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </div>
          )}

          {/* How It Works */}
          <HowItWorks />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">100% Private & Secure</h3>
              <p className="text-sm text-gray-600">
                All processing happens in your browser. Your files never leave your device or touch our servers.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Fast & Easy</h3>
              <p className="text-sm text-gray-600">
                Drag, drop, reorder, and merge. Simple workflow with professional results in seconds.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Download</h3>
              <p className="text-sm text-gray-600">
                Get your merged PDF immediately. No waiting, no accounts, no sign-ups required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
