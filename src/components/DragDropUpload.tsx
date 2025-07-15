import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload as UploadIcon, X } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DragDropUploadProps {
  type: 'audio' | 'image';
  file: File | null;
  onFileUpload: (file: File, type: 'audio' | 'image') => void;
  onRemoveFile: (type: 'audio' | 'image') => void;
  accept: string;
  title: string;
  description: string;
  supportedFormats: string;
  icon: LucideIcon;
}

export const DragDropUpload = ({
  type,
  file,
  onFileUpload,
  onRemoveFile,
  accept,
  title,
  description,
  supportedFormats,
  icon: Icon,
}: DragDropUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFile = files.find(file => {
      if (type === 'audio') {
        return file.type.startsWith('audio/');
      } else {
        return file.type.startsWith('image/');
      }
    });

    if (validFile) {
      onFileUpload(validFile, type);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileUpload(selectedFile, type);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="bg-gradient-card border-glass p-6 shadow-card">
      <div className="flex items-center mb-4">
        <Icon className="w-5 h-5 text-primary mr-2" />
        <Label className="text-lg font-semibold">{title}</Label>
      </div>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            isDragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-glass hover:border-primary'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          <UploadIcon className={`w-12 h-12 mx-auto mb-4 transition-colors ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <p className={`mb-2 transition-colors ${
            isDragOver ? 'text-primary' : 'text-muted-foreground'
          }`}>
            {isDragOver ? `Drop your ${type} file here` : description}
          </p>
          <p className="text-sm text-muted-foreground">{supportedFormats}</p>
        </div>
      ) : (
        <div className="bg-secondary rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="w-8 h-8 text-primary mr-3" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFile(type)}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};