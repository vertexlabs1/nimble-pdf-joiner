
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Edit3 } from 'lucide-react';

interface FilenameInputProps {
  defaultFilename: string;
  onFilenameChange: (filename: string) => void;
}

export const FilenameInput = ({ defaultFilename, onFilenameChange }: FilenameInputProps) => {
  const [customFilename, setCustomFilename] = useState(defaultFilename);

  useEffect(() => {
    setCustomFilename(defaultFilename);
  }, [defaultFilename]);

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomFilename(e.target.value);
  };

  const handleFilenameBlur = () => {
    if (customFilename && !customFilename.toLowerCase().endsWith('.pdf')) {
      const newFilename = customFilename + '.pdf';
      setCustomFilename(newFilename);
      onFilenameChange(newFilename);
    } else {
      onFilenameChange(customFilename);
    }
  };

  const getDisplayFilename = () => {
    if (!customFilename) return 'merged-document.pdf';
    if (customFilename.toLowerCase().endsWith('.pdf')) return customFilename;
    return customFilename + '.pdf';
  };

  return (
    <div className="mb-6 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Edit3 className="h-4 w-4 text-gray-600" />
        <label htmlFor="filename" className="text-sm font-medium text-gray-700">
          Filename:
        </label>
      </div>
      <Input
        id="filename"
        type="text"
        value={customFilename}
        onChange={handleFilenameChange}
        onBlur={handleFilenameBlur}
        placeholder="Enter filename..."
        className="text-center"
      />
      <p className="text-xs text-gray-500 mt-1">
        Your file will be saved as: <span className="font-medium">{getDisplayFilename()}</span>
      </p>
    </div>
  );
};
