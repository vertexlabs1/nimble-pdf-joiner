
import { useState } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { FileList } from '@/components/FileList';
import { MergeButton } from '@/components/MergeButton';
import { Card } from '@/components/ui/card';
import { FileText, Zap, Download } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            PDF Merge Tool
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Combine multiple PDF files into one document. Upload, reorder, and merge - all processed securely in your browser.
          </p>
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
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">
                    Uploaded Files ({files.length})
                  </h2>
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

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Private</h3>
              <p className="text-sm text-gray-600">
                All processing happens in your browser. Your files never leave your device.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Fast & Easy</h3>
              <p className="text-sm text-gray-600">
                Drag, drop, reorder, and merge. Simple workflow, professional results.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Download className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Download</h3>
              <p className="text-sm text-gray-600">
                Get your merged PDF immediately. No waiting, no sign-ups required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
