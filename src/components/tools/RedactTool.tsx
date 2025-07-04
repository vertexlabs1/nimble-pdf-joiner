import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PDF_CONFIG } from '@/lib/pdfConfig';
import { ChevronLeft, ChevronRight, Undo, Redo, Download, Square, Hand, Upload } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import '../../pdf-styles.css';

interface RedactionArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}

interface RedactToolProps {
  file?: File;
  onFileSelect?: (file: File) => void;
}

export default function RedactTool({ file, onFileSelect }: RedactToolProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState<'redact' | 'pan'>('redact');
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRedaction, setCurrentRedaction] = useState<RedactionArea | null>(null);
  const [history, setHistory] = useState<RedactionArea[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
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

  const addToHistory = (newAreas: RedactionArea[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newAreas]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setRedactionAreas([...history[historyIndex - 1]]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setRedactionAreas([...history[historyIndex + 1]]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drawMode !== 'redact' || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsDrawing(true);
    setCurrentRedaction({
      id: Date.now().toString(),
      x,
      y,
      width: 0,
      height: 0,
      pageNumber
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !canvasRef.current || drawMode !== 'redact') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;
    
    setCurrentRedaction({
      id: Date.now().toString(),
      x: width > 0 ? startPoint.x : currentX,
      y: height > 0 ? startPoint.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
      pageNumber
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRedaction) return;
    
    if (currentRedaction.width > 10 && currentRedaction.height > 10) {
      const newAreas = [...redactionAreas, currentRedaction];
      setRedactionAreas(newAreas);
      addToHistory(newAreas);
    }
    
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRedaction(null);
  };

  const removeRedaction = (id: string) => {
    const newAreas = redactionAreas.filter(area => area.id !== id);
    setRedactionAreas(newAreas);
    addToHistory(newAreas);
  };

  const processRedactedPDF = async () => {
    if (!file || redactionAreas.length === 0) {
      toast({
        title: 'No redactions',
        description: 'Please add redaction areas before processing',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const pages = pdfDoc.getPages();

      // Group redactions by page
      const redactionsByPage = redactionAreas.reduce((acc, area) => {
        if (!acc[area.pageNumber]) acc[area.pageNumber] = [];
        acc[area.pageNumber].push(area);
        return acc;
      }, {} as Record<number, RedactionArea[]>);

      // Apply redactions to each page
      Object.entries(redactionsByPage).forEach(([pageNum, areas]) => {
        const page = pages[parseInt(pageNum) - 1];
        if (!page) return;

        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        areas.forEach(area => {
          // Convert screen coordinates to PDF coordinates
          const pdfX = (area.x / (canvasRef.current?.offsetWidth || 1)) * pageWidth;
          const pdfY = pageHeight - ((area.y + area.height) / (canvasRef.current?.offsetHeight || 1)) * pageHeight;
          const pdfWidth = (area.width / (canvasRef.current?.offsetWidth || 1)) * pageWidth;
          const pdfHeight = (area.height / (canvasRef.current?.offsetHeight || 1)) * pageHeight;

          // Draw black rectangle
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfWidth,
            height: pdfHeight,
            color: rgb(0, 0, 0),
          });
        });
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redacted-${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success!',
        description: 'Redacted PDF has been downloaded',
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: 'Processing failed',
        description: 'Failed to process the redacted PDF',
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
      setRedactionAreas([]);
      setHistory([[]]);
      setHistoryIndex(0);
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
          <h3 className="text-lg font-semibold">Upload PDF to Redact</h3>
          <p className="text-muted-foreground">Select a PDF file to start redacting sensitive information</p>
          <div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="redact-pdf-upload"
            />
            <Button asChild>
              <label htmlFor="redact-pdf-upload" className="cursor-pointer">
                Choose PDF File
              </label>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{file.name}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={drawMode === 'redact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawMode('redact')}
            >
              <Square className="h-4 w-4 mr-2" />
              Redact
            </Button>
            <Button
              variant={drawMode === 'pan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawMode('pan')}
            >
              <Hand className="h-4 w-4 mr-2" />
              Pan
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={historyIndex <= 0}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
            <Redo className="h-4 w-4" />
          </Button>
          <Button 
            onClick={processRedactedPDF} 
            disabled={redactionAreas.length === 0 || isProcessing}
            className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
          >
            {isProcessing ? 'Processing...' : 'Download Redacted PDF'}
            <Download className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

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

      {/* PDF Viewer with Redaction Overlay */}
      <Card className="relative overflow-hidden">
        <div 
          ref={canvasRef}
          className="relative inline-block cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{ cursor: drawMode === 'redact' ? 'crosshair' : 'grab' }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              loading=""
            />
          </Document>
          
          {/* Redaction Areas Overlay */}
          {redactionAreas
            .filter(area => area.pageNumber === pageNumber)
            .map(area => (
              <div
                key={area.id}
                className="absolute bg-black bg-opacity-80 border-2 border-red-500 cursor-pointer group"
                style={{
                  left: area.x,
                  top: area.y,
                  width: area.width,
                  height: area.height,
                }}
                onClick={() => removeRedaction(area.id)}
                title="Click to remove redaction"
              >
                <div className="absolute inset-0 bg-red-500 bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          
          {/* Current Drawing Area */}
          {currentRedaction && drawMode === 'redact' && (
            <div
              className="absolute bg-black bg-opacity-60 border-2 border-red-500 border-dashed"
              style={{
                left: currentRedaction.x,
                top: currentRedaction.y,
                width: currentRedaction.width,
                height: currentRedaction.height,
              }}
            />
          )}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <p>• Select "Redact" mode and drag to create redaction areas over sensitive content</p>
          <p>• Click on existing redaction areas to remove them</p>
          <p>• Use Undo/Redo to manage your changes</p>
          <p>• Click "Download Redacted PDF" when finished</p>
        </div>
      </Card>
    </div>
  );
}