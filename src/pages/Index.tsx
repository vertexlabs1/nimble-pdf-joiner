
import { useState, useEffect } from 'react';
import { PDFUploader } from '@/components/PDFUploader';
import { FileList } from '@/components/FileList';
import { MergeButton } from '@/components/MergeButton';
import { FilenameInput } from '@/components/FilenameInput';
import { SecurityCallout } from '@/components/SecurityCallout';
import { SecurityInfoDialog } from '@/components/SecurityInfoDialog';
import { HowItWorks } from '@/components/HowItWorks';
import { UsageStats } from '@/components/UsageStats';
import { BuyMeACoffeeButton } from '@/components/BuyMeACoffeeButton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { FileText, Shield, Zap, Lock, Eye, Download } from 'lucide-react';
import { PDFFileWithPages } from '@/types/pdf';
import { PDFDocument } from 'pdf-lib';

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [enhancedFiles, setEnhancedFiles] = useState<PDFFileWithPages[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customFilename, setCustomFilename] = useState('merged-document.pdf');

  // Simple function to get basic PDF info using pdf-lib
  const getBasicFileInfo = async (file: File): Promise<PDFFileWithPages> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      return {
        originalFile: file,
        pageCount,
        pages: [],
        isModified: false,
      };
    } catch (error) {
      console.error('Error getting basic info for:', file.name, error);
      return {
        originalFile: file,
        pageCount: 1,
        pages: [],
        isModified: false,
      };
    }
  };

  // Fast basic processing - only get page counts, no thumbnails
  useEffect(() => {
    console.log('=== FILES CHANGED ===');
    console.log('New files array:', files.map(f => f.name));
    
    const processFilesBasic = async () => {
      if (files.length === 0) {
        console.log('No files to process, clearing enhanced files');
        setEnhancedFiles([]);
        setIsProcessing(false);
        return;
      }

      console.log('Starting basic processing (page counts only)...');
      setIsProcessing(true);
      
      try {
        // Process all files in parallel for basic info
        const basicInfoPromises = files.map(file => getBasicFileInfo(file));
        const results = await Promise.all(basicInfoPromises);
        
        console.log('Basic processing complete:', results.map(r => ({
          name: r.originalFile.name,
          pageCount: r.pageCount
        })));

        setEnhancedFiles(results);
        
      } catch (error) {
        console.error('Error in basic processing:', error);
        // Create fallback results
        const fallbackResults: PDFFileWithPages[] = files.map(file => ({
          originalFile: file,
          pageCount: 1,
          pages: [],
          isModified: false,
        }));
        setEnhancedFiles(fallbackResults);
      } finally {
        setIsProcessing(false);
        console.log('Basic processing completed');
      }
    };

    processFilesBasic();
  }, [files]);

  const handleFilesAdded = (newFiles: File[]) => {
    console.log('Adding new files:', newFiles.map(f => f.name));
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    // Update filename when files are added
    if (updatedFiles.length > 0) {
      const defaultName = `merged-${updatedFiles[0].name.replace('.pdf', '')}.pdf`;
      setCustomFilename(defaultName);
    }
  };

  const handleReorder = (newFiles: File[]) => {
    console.log('Reordering files:', newFiles.map(f => f.name));
    setFiles(newFiles);
    // Update filename when files are reordered
    if (newFiles.length > 0) {
      const defaultName = `merged-${newFiles[0].name.replace('.pdf', '')}.pdf`;
      setCustomFilename(defaultName);
    }
  };

  const handleRemove = (index: number) => {
    console.log('Removing file at index:', index);
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    console.log('Clearing all files');
    setFiles([]);
    setEnhancedFiles([]);
    setIsProcessing(false);
    setCustomFilename('merged-document.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 animate-page-enter">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-400 to-blue-400 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex justify-center items-center gap-2 mb-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              100% Private
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
              <Lock className="h-3 w-3 mr-1" />
              No Uploads
            </Badge>
            <SecurityInfoDialog />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Merge PDF Securely
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-2">
            Merge multiple PDF files privately and securely - all processing happens in your browser
          </p>
          <p className="text-sm text-green-600 font-medium">
            ✓ Your files never leave your device ✓ No server uploads ✓ Complete privacy
          </p>
        </header>

        {/* Security Callout */}
        <div className="max-w-3xl mx-auto mb-8">
          <SecurityCallout />
          <UsageStats />
        </div>


        {/* Main Content */}
        <main className="max-w-4xl mx-auto space-y-8">
          {/* Upload Area */}
          <section>
            <Card className="p-8 bg-white/80 border border-gray-200 backdrop-blur-sm shadow-lg">
              <PDFUploader onFilesAdded={handleFilesAdded} disabled={isLoading || isProcessing} />
            </Card>
          </section>

          {/* File List */}
          {files.length > 0 && (
            <section>
              <Card className="p-6 bg-white/80 border border-gray-200 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Uploaded Files ({files.length})
                    </h2>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <Eye className="h-3 w-3 mr-1" />
                      Processed locally
                    </Badge>
                    {isProcessing && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                        Processing...
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={handleClear}
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                    disabled={isLoading || isProcessing}
                  >
                    Clear All
                  </button>
                </div>
                <FileList
                  files={files}
                  enhancedFiles={enhancedFiles}
                  onReorder={handleReorder}
                  onRemove={handleRemove}
                  disabled={isLoading || isProcessing}
                />
              </Card>
            </section>
          )}

          {/* Filename Input */}
          {files.length >= 2 && !isProcessing && (
            <section>
              <Card className="p-6 bg-white/80 border border-gray-200 backdrop-blur-sm shadow-lg">
                <FilenameInput
                  defaultFilename={customFilename}
                  onFilenameChange={setCustomFilename}
                />
              </Card>
            </section>
          )}

          {/* Merge Button */}
          {files.length >= 2 && !isProcessing && (
            <section className="text-center">
              <MergeButton
                files={files}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                customFilename={customFilename}
              />
            </section>
          )}

          {/* How It Works */}
          <HowItWorks />

          {/* Features */}
          <section className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="text-center p-6">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4 border border-green-200">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">100% Private & Secure</h3>
              <p className="text-sm text-gray-600">
                All processing happens in your browser. Your files never leave your device or touch our servers.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4 border border-blue-200">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">Fast & Easy</h3>
              <p className="text-sm text-gray-600">
                Drag, drop, reorder, and merge. Simple workflow with professional results in seconds.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4 border border-purple-200">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2 text-gray-900">Instant Download</h3>
              <p className="text-sm text-gray-600">
                Get your merged PDF immediately. No waiting, no accounts, no sign-ups required.
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8">
          <Separator className="mb-8 bg-gray-200" />
          
          {/* Product Hunt & Buy Me a Coffee Badges */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
            <a 
              href="https://www.producthunt.com/products/merge-pdf-securely?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-merge&#0045;pdf&#0045;securely" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block hover:scale-105 transition-transform duration-200"
            >
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=985982&theme=light&t=1751390980188" 
                alt="Merge PDF Securely - Merge PDFs in your browser — fast, private, and secure | Product Hunt" 
                className="w-60 h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                width="240" 
                height="52" 
              />
            </a>
            
            <div className="flex items-center">
              <BuyMeACoffeeButton />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p>© 2025 MergePDFSecurely.com</p>
              <Link 
                to="/privacy" 
                className="text-green-600 hover:text-green-700 transition-colors underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </div>
            <p className="text-gray-500">
              Built by <span className="font-medium text-gray-600">VertexLabs</span>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
