'use client';

import { useCallback, useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageDropboxProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  minImages?: number;
  error?: string;
}

export function ImageDropbox({ images, onImagesChange, maxImages = 5, minImages = 1, error }: ImageDropboxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const addImages = useCallback(
    (newFiles: File[]) => {
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) return;

      const filesToAdd = newFiles.slice(0, remainingSlots);
      onImagesChange([...images, ...filesToAdd]);
    },
    [images, maxImages, onImagesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
      addImages(files);
    },
    [addImages],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'));
      addImages(files);
      e.target.value = '';
    },
    [addImages],
  );

  // Create preview URLs when images change
  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup function to revoke object URLs
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  const removeImage = (index: number) => {
    // Revoke the URL for the removed image
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          error && 'border-destructive',
        )}
      >
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
          disabled={images.length >= maxImages}
        />
        <label
          htmlFor="image-upload"
          className={cn(
            'flex flex-col items-center justify-center gap-4 cursor-pointer',
            images.length >= maxImages && 'cursor-not-allowed opacity-50',
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {images.length === 0 ? (
              <Upload className="h-10 w-10 text-muted-foreground" />
            ) : (
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium">
                {images.length >= maxImages
                  ? `Maximum ${maxImages} images reached`
                  : isDragging
                    ? 'Drop images here'
                    : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {images.length > 0
                  ? `${images.length}/${maxImages} images selected`
                  : `Minimum ${minImages}, Maximum ${maxImages} images`}
              </p>
            </div>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                <img src={previewUrls[index]} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                {image.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
