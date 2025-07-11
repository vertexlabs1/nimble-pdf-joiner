
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
import { FileText, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { PDFFileWithPages } from '@/types/pdf';

interface FileListProps {
  files: File[];
  enhancedFiles?: PDFFileWithPages[];
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

interface SortableFileItemProps {
  file: File;
  enhancedFile?: PDFFileWithPages;
  index: number;
  onRemove: (index: number) => void;
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
  disabled, 
  isDragOverlay = false 
}: SortableFileItemProps) => {
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
        <div className="bg-red-100 p-2 rounded relative">
          <FileText className="h-5 w-5 text-red-600" />
          <div className="absolute -bottom-1 -right-1 bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
            #{index + 1}
          </div>
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
            {enhancedFile && enhancedFile.pageCount > 0 && (
              <span>• {enhancedFile.pageCount} page{enhancedFile.pageCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-gray-400 hover:text-red-600 p-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const FileList = ({ 
  files, 
  enhancedFiles, 
  onReorder, 
  onRemove, 
  disabled 
}: FileListProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedFile, setDraggedFile] = useState<{ file: File; index: number } | null>(null);

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

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-4">
        Drag files to reorder them. The merged PDF will follow this order.
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
    </div>
  );
};
