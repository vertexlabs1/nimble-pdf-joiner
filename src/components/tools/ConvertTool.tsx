import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileImage, Loader2 } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import JSZip from 'jszip';
import '../../pdf-styles.css';

interface ConvertToolProps {
  file?: File;
  onFileSelect?: (file: File) => void;
}

type OutputFormat = 'png' | 'jpg' | 'webp';

export default function ConvertTool({ file, onFileSelect }: ConvertToolProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [format, setFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState([0.9]);
  const [pageRange, setPageRange] = useState('all');
  const [customRange, setCustomRange] = useState('1-5');
  const [resolution, setResolution] = useState([150]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    toast({
      title: 'Error loading PDF',
      description: 'Failed to load the PDF file. It may be corrupted or encrypted.',
      variant: 'destructive'
    });
    setLoading(false);
  };

  const parsePageRange = (range: string, totalPages: number): number[] => {
    if (range === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const parts = range.split(',').map(s => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (start && end && start <= totalPages && end <= totalPages && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(part);
        if (pageNum && pageNum <= totalPages && !pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  };

  const convertPDFToImages = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please upload a PDF file first',
        variant: 'destructive'
      });
      return;
    }

    const pages = parsePageRange(pageRange === 'all' ? 'all' : customRange, numPages);
    
    if (pages.length === 0) {
      toast({
        title: 'Invalid page range',
        description: 'Please specify valid page numbers',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: fileArrayBuffer }).promise;
      const zip = new JSZip();
      const scale = resolution[0] / 72; // Convert DPI to scale

      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i];
        setProcessingProgress(Math.round(((i + 1) / pages.length) * 100));

        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!);
              }, `image/${format}`, format === 'jpg' ? quality[0] : undefined);
            });

            const fileName = `page-${pageNum.toString().padStart(3, '0')}.${format}`;
            zip.file(fileName, blob);
          }
        } catch (pageError) {
          console.error(`Error processing page ${pageNum}:`, pageError);
        }
      }

      // Generate and download ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}-converted.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: `Converted ${pages.length} pages to ${format.toUpperCase()} format`,
      });
    } catch (error) {
      console.error('Error converting PDF:', error);
      toast({
        title: 'Conversion failed',
        description: 'Failed to convert the PDF to images',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      onFileSelect?.(uploadedFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
    }
  };

  if (!file) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Upload PDF to Convert</h3>
          <p className="text-muted-foreground">Select a PDF file to convert to images</p>
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="convert-pdf-upload"
            />
            <Button asChild>
              <label htmlFor="convert-pdf-upload" className="cursor-pointer">
                Choose PDF File
              </label>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{file.name}</h2>
        <Button 
          onClick={convertPDFToImages} 
          disabled={isProcessing}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Converting... {processingProgress}%
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Convert & Download
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Conversion Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="format">Output Format</Label>
              <Select value={format} onValueChange={(value: OutputFormat) => setFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG (Lossless)</SelectItem>
                  <SelectItem value="jpg">JPEG (Compressed)</SelectItem>
                  <SelectItem value="webp">WebP (Modern)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Resolution: {resolution[0]} DPI</Label>
              <Slider
                value={resolution}
                onValueChange={setResolution}
                max={300}
                min={72}
                step={24}
                className="mt-2"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Higher DPI = Better quality, larger files
              </div>
            </div>

            {(format === 'jpg' || format === 'webp') && (
              <div>
                <Label>Quality: {Math.round(quality[0] * 100)}%</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>Page Range</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-pages"
                    checked={pageRange === 'all'}
                    onCheckedChange={(checked) => setPageRange(checked ? 'all' : 'custom')}
                  />
                  <Label htmlFor="all-pages">All pages ({numPages} total)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom-range"
                    checked={pageRange === 'custom'}
                    onCheckedChange={(checked) => setPageRange(checked ? 'custom' : 'all')}
                  />
                  <Label htmlFor="custom-range">Custom range</Label>
                </div>
              </div>
              
              {pageRange === 'custom' && (
                <Input
                  value={customRange}
                  onChange={(e) => setCustomRange(e.target.value)}
                  placeholder="e.g., 1-5, 8, 10-12"
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* File Info */}
          <div className="pt-4 border-t space-y-2">
            <h4 className="font-medium text-sm">File Information</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Pages: {numPages}</p>
              <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <p>Format: PDF</p>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <div className="flex justify-center">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading="Loading PDF preview..."
              >
                <Page
                  pageNumber={1}
                  scale={0.6}
                  loading=""
                />
              </Document>
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Preview of page 1 - All selected pages will be converted
            </div>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="p-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <p>• Choose your preferred image format and quality settings</p>
          <p>• Select which pages to convert (all pages or specific ranges)</p>
          <p>• Higher DPI settings produce better quality but larger file sizes</p>
          <p>• All converted images will be downloaded as a ZIP file</p>
        </div>
      </Card>
    </div>
  );
}