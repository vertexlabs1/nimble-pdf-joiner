
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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

interface FileListProps {
  files: File[];
  onReorder: (files: File[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

interface SortableFileItemProps {
  file: File;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

const SortableFileItem = ({ file, index, onRemove, disabled }: SortableFileItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.name + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
        flex items-center gap-4 p-4 bg-white border rounded-lg shadow-sm transition-all
        ${isDragging ? 'shadow-lg ring-2 ring-blue-200' : 'hover:shadow-md'}
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
        <div className="bg-red-100 p-2 rounded">
          <FileText className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{file.name}</p>
          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          #{index + 1}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="text-gray-400 hover:text-red-600 p-1 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const FileList = ({ files, onReorder, onRemove, disabled }: FileListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = files.findIndex((file, index) => file.name + index === active.id);
      const newIndex = files.findIndex((file, index) => file.name + index === over?.id);

      onReorder(arrayMove(files, oldIndex, newIndex));
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
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={files.map((file, index) => file.name + index)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {files.map((file, index) => (
              <SortableFileItem
                key={file.name + index}
                file={file}
                index={index}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
