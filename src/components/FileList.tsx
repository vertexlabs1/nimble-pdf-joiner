
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { PDFFileWithPages } from '@/types/pdf';
import { PageEditModal } from '@/components/PageEditModal';

interface FileListProps {
  files: File[];
  enhancedFiles?: PDFFileWithPages[];
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  onFileUpdate?: (index: number, updatedFile: PDFFileWithPages) => void;
  disabled?: boolean;
}

interface SortableFileItemProps {
  file: File;
  enhancedFile?: PDFFileWithPages;
  index: number;
  onRemove: (index: number) => void;
  onEdit?: () => void;
  disabled?: boolean;
  isDragOverlay?: boolean;
}

// Generate stable unique ID for each file
const generateFileId = (file: File, index: number): string => {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
};

const SortableFileItem = ({ 
  file, 
  enhancedFile, 
  index, 
  onRemove, 
  onEdit, 
  disabled, 
  isDragOverlay = false 
}: SortableFileItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const fileId = generateFileId(file, index);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: fileId,
    disabled: disabled || isDragOverlay
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragOverlay ? undefined : transition,
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isMultiPage = enhancedFile && enhancedFile.pageCount > 1;
  const showEditButton = isMultiPage && onEdit;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm
        ${isDragging && !isDragOverlay ? 'opacity-50' : ''}
        ${isDragOverlay ? 'shadow-xl ring-2 ring-blue-300 scale-105' : 'hover:shadow-md'}
        ${disabled ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className={`
          flex items-center justify-center w-8 h-8 rounded cursor-grab active:cursor-grabbing
          ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}
        `}
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>
      
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="bg-red-100 p-2 rounded">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{file.name}</p>
            {enhancedFile?.isModified && (
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" title="Modified" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            {isMultiPage && (
              <span>• {enhancedFile.pageCount} pages</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          #{index + 1}
        </span>
        
        {/* Edit button - shows on hover for desktop, always visible on touch devices for multi-page PDFs */}
        {showEditButton && !isDragOverlay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            disabled={disabled}
            className={`
              text-gray-400 hover:text-blue-600 p-1 h-8 w-8 transition-opacity
              ${isHovered ? 'opacity-100' : 'opacity-0 md:opacity-0'}
              ${isMultiPage ? 'sm:opacity-100 md:opacity-0 md:hover:opacity-100' : ''}
            `}
            title="Edit pages"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        
        {!isDragOverlay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="text-gray-400 hover:text-red-600 p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const FileList = ({ 
  files, 
  enhancedFiles, 
  onReorder, 
  onRemove, 
  onFileUpdate, 
  disabled 
}: FileListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<{ file: File; index: number } | null>(null);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged file
    const fileIndex = files.findIndex((file, index) => generateFileId(file, index) === active.id);
    if (fileIndex !== -1) {
      setDraggedFile({ file: files[fileIndex], index: fileIndex });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedFile(null);

    if (active.id !== over?.id) {
      const oldIndex = files.findIndex((file, index) => generateFileId(file, index) === active.id);
      const newIndex = files.findIndex((file, index) => generateFileId(file, index) === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(files, oldIndex, newIndex));
      }
    }
  };

  const handleEditFile = (index: number) => {
    setEditingFileIndex(index);
  };

  const handleFileUpdate = (updatedFile: PDFFileWithPages) => {
    if (editingFileIndex !== null && onFileUpdate) {
      onFileUpdate(editingFileIndex, updatedFile);
    }
    setEditingFileIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Drag files to reorder them. The merged PDF will follow this order.
        {enhancedFiles?.some(f => f && f.pageCount > 1) && (
          <span className="block text-xs text-blue-600 mt-1">
            💡 Click the edit icon on multi-page PDFs to replace individual pages
          </span>
        )}
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map((file, index) => generateFileId(file, index))}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {files.map((file, index) => (
              <SortableFileItem
                key={generateFileId(file, index)}
                file={file}
                enhancedFile={enhancedFiles?.[index]}
                index={index}
                onRemove={onRemove}
                onEdit={() => handleEditFile(index)}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
        
        <DragOverlay>
          {activeId && draggedFile ? (
            <SortableFileItem
              file={draggedFile.file}
              enhancedFile={enhancedFiles?.[draggedFile.index]}
              index={draggedFile.index}
              onRemove={onRemove}
              disabled={disabled}
              isDragOverlay={true}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Page Edit Modal */}
      {editingFileIndex !== null && enhancedFiles?.[editingFileIndex] && (
        <PageEditModal
          open={true}
          onOpenChange={(open) => !open && setEditingFileIndex(null)}
          file={enhancedFiles[editingFileIndex]}
          allFiles={enhancedFiles.filter(Boolean) as PDFFileWithPages[]}
          onFileUpdate={handleFileUpdate}
        />
      )}
    </div>
  );
};
