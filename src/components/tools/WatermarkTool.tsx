import React, { useState, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Download, Upload, Droplets } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import '../../pdf-styles.css';

interface WatermarkToolProps {
  file?: File;
  onFileSelect?: (file: File) => void;
}

type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'diagonal';

export default function WatermarkTool({ file, onFileSelect }: WatermarkToolProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState([0.3]);
  const [fontSize, setFontSize] = useState([48]);
  const [position, setPosition] = useState<WatermarkPosition>('diagonal');
  const [color, setColor] = useState('#ff0000');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
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

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 1, g: 0, b: 0 };
  };

  const getWatermarkPosition = (pageWidth: number, pageHeight: number, textWidth: number, textHeight: number) => {
    switch (position) {
      case 'center':
        return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2, rotation: 0 };
      case 'top-left':
        return { x: 50, y: pageHeight - textHeight - 50, rotation: 0 };
      case 'top-right':
        return { x: pageWidth - textWidth - 50, y: pageHeight - textHeight - 50, rotation: 0 };
      case 'bottom-left':
        return { x: 50, y: 50, rotation: 0 };
      case 'bottom-right':
        return { x: pageWidth - textWidth - 50, y: 50, rotation: 0 };
      case 'diagonal':
        return { 
          x: (pageWidth - textWidth) / 2, 
          y: (pageHeight - textHeight) / 2, 
          rotation: -Math.PI / 4 
        };
      default:
        return { x: (pageWidth - textWidth) / 2, y: (pageHeight - textHeight) / 2, rotation: 0 };
    }
  };

  const processWatermarkedPDF = async () => {
    if (!file || !watermarkText.trim()) {
      toast({
        title: 'Missing requirements',
        description: 'Please provide both a PDF file and watermark text',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const { r, g, b } = hexToRgb(color);

      pages.forEach(page => {
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const textSize = fontSize[0];
        const textWidth = font.widthOfTextAtSize(watermarkText, textSize);
        const textHeight = font.heightAtSize(textSize);
        
        const { x, y, rotation } = getWatermarkPosition(pageWidth, pageHeight, textWidth, textHeight);

        page.drawText(watermarkText, {
          x,
          y,
          size: textSize,
          font,
          color: rgb(r, g, b),
          opacity: opacity[0],
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: 'Watermarked PDF has been downloaded',
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: 'Processing failed',
        description: 'Failed to process the watermarked PDF',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      onFileSelect?.(uploadedFile);
      setPageNumber(1);
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
          <h3 className="text-lg font-semibold">Upload PDF to Watermark</h3>
          <p className="text-muted-foreground">Select a PDF file to add watermarks</p>
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="watermark-pdf-upload"
            />
            <Button asChild>
              <label htmlFor="watermark-pdf-upload" className="cursor-pointer">
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
          onClick={processWatermarkedPDF} 
          disabled={!watermarkText.trim() || isProcessing}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          {isProcessing ? 'Processing...' : 'Download Watermarked PDF'}
          <Download className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Watermark Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="watermark-text">Watermark Text</Label>
              <Input
                id="watermark-text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="Enter watermark text"
              />
            </div>

            <div>
              <Label>Opacity: {Math.round(opacity[0] * 100)}%</Label>
              <Slider
                value={opacity}
                onValueChange={setOpacity}
                max={1}
                min={0.1}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Font Size: {fontSize[0]}px</Label>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                max={72}
                min={12}
                step={4}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Select value={position} onValueChange={(value: WatermarkPosition) => setPosition(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-8 rounded border border-border"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#ff0000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* PDF Preview with Watermark */}
          <Card className="relative overflow-hidden">
            <div 
              ref={canvasRef}
              className="relative inline-block w-full flex justify-center"
            >
              <div className="relative">
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading=""
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={0.8}
                    loading=""
                  />
                </Document>
                
                {/* Live Watermark Preview */}
                {watermarkText.trim() && (
                  <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center text-6xl font-bold select-none"
                    style={{
                      color: color,
                      opacity: opacity[0],
                      fontSize: `${fontSize[0] * 0.8}px`,
                      transform: position === 'diagonal' ? 'rotate(-45deg)' : 'none',
                      ...(() => {
                        switch (position) {
                          case 'top-left':
                            return { justifyContent: 'flex-start', alignItems: 'flex-start', padding: '20px' };
                          case 'top-right':
                            return { justifyContent: 'flex-end', alignItems: 'flex-start', padding: '20px' };
                          case 'bottom-left':
                            return { justifyContent: 'flex-start', alignItems: 'flex-end', padding: '20px' };
                          case 'bottom-right':
                            return { justifyContent: 'flex-end', alignItems: 'flex-end', padding: '20px' };
                          case 'center':
                          case 'diagonal':
                          default:
                            return { justifyContent: 'center', alignItems: 'center' };
                        }
                      })()
                    }}
                  >
                    {watermarkText}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card className="p-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <p>• Enter your watermark text and adjust the appearance settings</p>
          <p>• Preview how the watermark will look on each page</p>
          <p>• The watermark will be applied to all pages when you download</p>
          <p>• Use lower opacity for subtle watermarks that don't interfere with content</p>
        </div>
      </Card>
    </div>
  );
}