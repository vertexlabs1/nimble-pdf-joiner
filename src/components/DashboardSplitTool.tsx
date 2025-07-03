import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Scissors, Upload, FileText, Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import PDFPageGrid from '@/components/PDFPageGrid';
import UnifiedPDFThumbnail from '@/components/UnifiedPDFThumbnail';
import { splitPDF, SplitConfig, SplitResult, validatePageRanges } from '@/utils/pdfSplitUtils';
import { downloadBlob } from '@/utils/pdfUtils';

export const DashboardSplitTool = () => {
  const [file, setFile] = useState<File | null>(null);
  const [splitMethod, setSplitMethod] = useState<'page-range' | 'specific-pages' | 'file-size' | 'individual-pages'>('page-range');
  const [pageRanges, setPageRanges] = useState('1-5');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [targetSizeKB, setTargetSizeKB] = useState(1000);
  const [filenameTemplate, setFilenameTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [splitResult, setSplitResult] = useState<SplitResult | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pageRangeError, setPageRangeError] = useState<string>('');
  const { toast } = useToast();

  // Update filename template when file or method changes
  useEffect(() => {
    if (file) {
      const baseName = file.name.replace('.pdf', '');
      switch (splitMethod) {
        case 'page-range':
          setFilenameTemplate(`${baseName}_pages_{pages}.pdf`);
          break;
        case 'specific-pages':
          setFilenameTemplate(`${baseName}_page_{page}.pdf`);
          break;
        case 'file-size':
          setFilenameTemplate(`${baseName}_part_{index}.pdf`);
          break;
        case 'individual-pages':
          setFilenameTemplate(`${baseName}_page_{page}.pdf`);
          break;
      }
    }
  }, [file, splitMethod]);

  // Validate page ranges when they change
  useEffect(() => {
    if (splitMethod === 'page-range' && totalPages > 0) {
      const validation = validatePageRanges(pageRanges, totalPages);
      setPageRangeError(validation.valid ? '' : validation.error || '');
    }
  }, [pageRanges, totalPages, splitMethod]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
      setSplitResult(null);
      setSelectedPages([]);
      setPageRangeError('');
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
    }
  };

  const handlePageThumbnailLoad = (pageCount: number) => {
    setTotalPages(pageCount);
  };

  const togglePageSelection = (pageNumber: number) => {
    setSelectedPages(prev => 
      prev.includes(pageNumber)
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber].sort((a, b) => a - b)
    );
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1));
  };

  const clearPageSelection = () => {
    setSelectedPages([]);
  };

  const handleSplit = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please upload a PDF file first',
        variant: 'destructive',
      });
      return;
    }

    // Validate based on split method
    if (splitMethod === 'page-range') {
      const validation = validatePageRanges(pageRanges, totalPages);
      if (!validation.valid) {
        toast({
          title: 'Invalid page ranges',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }
    } else if (splitMethod === 'specific-pages' && selectedPages.length === 0) {
      toast({
        title: 'No pages selected',
        description: 'Please select at least one page to extract',
        variant: 'destructive',
      });
      return;
    } else if (splitMethod === 'file-size' && targetSizeKB <= 0) {
      toast({
        title: 'Invalid file size',
        description: 'Please enter a valid target file size',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const config: SplitConfig = {
        method: splitMethod,
        pageRanges: splitMethod === 'page-range' ? pageRanges : undefined,
        specificPages: splitMethod === 'specific-pages' ? selectedPages : undefined,
        targetSizeKB: splitMethod === 'file-size' ? targetSizeKB : undefined,
        filenameTemplate,
      };

      const result = await splitPDF(file, config);
      setSplitResult(result);

      if (result.success) {
        toast({
          title: 'PDF split successfully!',
          description: `Created ${result.splitFiles.length} files`,
        });
      } else {
        toast({
          title: 'Split failed',
          description: result.errors.join(', '),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Split error:', error);
      toast({
        title: 'Split failed',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllFiles = () => {
    if (!splitResult?.splitFiles) return;

    splitResult.splitFiles.forEach(splitFile => {
      downloadBlob(splitFile.pdfBytes, splitFile.filename);
    });

    toast({
      title: 'Downloads started',
      description: `Downloading ${splitResult.splitFiles.length} files`,
    });
  };

  const downloadSingleFile = (splitFile: any) => {
    downloadBlob(splitFile.pdfBytes, splitFile.filename);
  };

  const resetTool = () => {
    setFile(null);
    setSplitResult(null);
    setSelectedPages([]);
    setPageRangeError('');
    setTotalPages(0);
  };

  // Show results if we have them
  if (splitResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Split Results</h1>
            <p className="text-muted-foreground">
              {splitResult.success ? `Successfully split into ${splitResult.splitFiles.length} files` : 'Split failed'}
            </p>
          </div>
          <Button onClick={resetTool} variant="outline">
            Split Another PDF
          </Button>
        </div>

        {splitResult.success ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Original file: {splitResult.originalFilename}
              </p>
              <Button onClick={downloadAllFiles} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="grid gap-4">
              {splitResult.splitFiles.map((splitFile, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{splitFile.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {splitFile.pageCount} page{splitFile.pageCount !== 1 ? 's' : ''} 
                          {splitFile.startPage !== splitFile.endPage ? 
                            ` (${splitFile.startPage}-${splitFile.endPage})` : 
                            ` (page ${splitFile.startPage})`
                          } • {Math.round(splitFile.pdfBytes.length / 1024)} KB
                        </p>
                      </div>
                      <Button 
                        onClick={() => downloadSingleFile(splitFile)}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Split failed:</p>
                <ul className="text-sm space-y-1">
                  {splitResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Split PDFs</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Split large PDF files into smaller documents using various methods
        </p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload PDF File</CardTitle>
          <CardDescription>
            Select a PDF file to split into smaller documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload PDF</p>
                  <p className="text-xs text-muted-foreground">Only PDF files are supported</p>
                </div>
              </div>
            </label>
          </div>

          {file && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview */}
      {file && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PDF Preview</CardTitle>
            <CardDescription>
              {totalPages > 0 ? `${totalPages} pages found` : 'Loading pages...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PDFPageGrid 
              file={file} 
              onLoad={handlePageThumbnailLoad}
              showPageNumbers={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Split Configuration */}
      {file && totalPages > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Split Configuration</CardTitle>
            <CardDescription>
              Choose how you want to split the PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Split Method</Label>
              <RadioGroup value={splitMethod} onValueChange={(value: any) => setSplitMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="page-range" id="page-range" />
                  <Label htmlFor="page-range">Split by page ranges</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific-pages" id="specific-pages" />
                  <Label htmlFor="specific-pages">Extract specific pages</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="file-size" id="file-size" />
                  <Label htmlFor="file-size">Split by file size</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual-pages" id="individual-pages" />
                  <Label htmlFor="individual-pages">Split into individual pages</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Method-specific configuration */}
            {splitMethod === 'page-range' && (
              <div className="space-y-3">
                <Label htmlFor="page-ranges">Page Ranges</Label>
                <Input
                  id="page-ranges"
                  value={pageRanges}
                  onChange={(e) => setPageRanges(e.target.value)}
                  placeholder="e.g., 1-5, 8-12, 15"
                  className={pageRangeError ? 'border-destructive' : ''}
                />
                {pageRangeError && (
                  <p className="text-sm text-destructive">{pageRangeError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter page ranges separated by commas. Example: "1-5, 8-12, 15"
                </p>
              </div>
            )}

            {splitMethod === 'specific-pages' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Pages ({selectedPages.length} selected)</Label>
                  <div className="space-x-2">
                    <Button onClick={selectAllPages} variant="outline" size="sm">
                      Select All
                    </Button>
                    <Button onClick={clearPageSelection} variant="outline" size="sm">
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                    <div key={pageNumber} className="flex items-center space-x-2">
                      <Checkbox
                        id={`page-${pageNumber}`}
                        checked={selectedPages.includes(pageNumber)}
                        onCheckedChange={() => togglePageSelection(pageNumber)}
                      />
                      <Label htmlFor={`page-${pageNumber}`} className="text-sm">
                        {pageNumber}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {splitMethod === 'file-size' && (
              <div className="space-y-3">
                <Label htmlFor="target-size">Target File Size (KB)</Label>
                <Input
                  id="target-size"
                  type="number"
                  value={targetSizeKB}
                  onChange={(e) => setTargetSizeKB(parseInt(e.target.value) || 0)}
                  placeholder="1000"
                  min="1"
                />
                <p className="text-xs text-muted-foreground">
                  PDF will be split into chunks approximately this size. Actual sizes may vary.
                </p>
              </div>
            )}

            {splitMethod === 'individual-pages' && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This will create {totalPages} separate PDF files, one for each page.
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <Label htmlFor="filename-template">Filename Template</Label>
              <Input
                id="filename-template"
                value={filenameTemplate}
                onChange={(e) => setFilenameTemplate(e.target.value)}
                placeholder="document_part_{index}.pdf"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {'{index}'}, {'{page}'}, {'{start}'}, {'{end}'}, {'{pages}'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Split Button */}
      {file && totalPages > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleSplit}
            disabled={isLoading || (splitMethod === 'page-range' && !!pageRangeError)}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Splitting PDF...
              </>
            ) : (
              <>
                <Scissors className="h-5 w-5 mr-2" />
                Split PDF
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};