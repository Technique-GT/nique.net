import { useState, useRef, useCallback } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { AxiosError } from 'axios';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_SIZE = 10 * 1024 * 1024;

interface MediaDropZoneProps {
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export function MediaDropZone({ onUpload, disabled }: MediaDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Invalid file type. Use JPEG, PNG, GIF, WebP, or SVG.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError('File too large. Maximum size is 10 MB.');
        return;
      }

      setError(null);
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const data = await apiClient.post<unknown, { url: string; key: string }>(
          '/admin/media/upload',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
            },
          },
        );

        onUpload(data.url);
      } catch (err: unknown) {
        const msg =
          err instanceof AxiosError
            ? (err.response?.data as { message?: string } | undefined)?.message
            : null;
        setError(msg || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [disabled, uploading, upload],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !uploading) setDragOver(true);
    },
    [disabled, uploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled && !uploading) inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
          dragOver && 'border-primary bg-primary/5',
          uploading && 'pointer-events-none opacity-60',
          disabled && 'pointer-events-none opacity-50',
          error
            ? 'border-destructive/50'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = '';
          }}
          disabled={disabled || uploading}
        />

        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Uploading&hellip; {progress}%
            </p>
            <div className="w-full max-w-xs rounded-full bg-muted h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop an image here, or{' '}
                <span className="text-primary underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG, GIF, WebP, SVG &mdash; max 10 MB
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
