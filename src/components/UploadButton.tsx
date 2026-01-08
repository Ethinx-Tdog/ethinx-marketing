import { useState, useCallback } from "react";
import { Upload, Loader2, CheckCircle, ImageIcon, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  orderToken: string;
}

interface FileValidation {
  file: File;
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];

function validateFiles(files: FileList | File[]): FileValidation[] {
  return Array.from(files).map((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { file, valid: false, error: `Invalid type: ${file.type.split("/")[1] || "unknown"}` };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { file, valid: false, error: `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB` };
    }
    return { file, valid: true };
  });
}

export function UploadButton({ orderToken }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileValidation[]>([]);
  const { toast } = useToast();

  const handleFiles = useCallback((files: FileList | File[]) => {
    const validated = validateFiles(files);
    setPendingFiles(validated);
  }, []);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setPendingFiles([]);
  }, []);

  const uploadFiles = useCallback(async () => {
    const validFiles = pendingFiles.filter((f) => f.valid).map((f) => f.file);
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please add valid image files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const arr = await Promise.all(
        validFiles.map(async (f) => ({
          name: f.name,
          type: f.type,
          base64: await f
            .arrayBuffer()
            .then((b) => btoa(String.fromCharCode(...new Uint8Array(b)))),
        }))
      );

      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-photo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_token: orderToken, files: arr }),
        }
      );

      if (!r.ok) {
        const error = await r.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }

      setUploadedCount((prev) => prev + validFiles.length);
      setPendingFiles([]);
      toast({
        title: "Photos uploaded!",
        description: `Successfully uploaded ${validFiles.length} photo(s)`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [orderToken, pendingFiles, toast]);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const validCount = pendingFiles.filter((f) => f.valid).length;
  const invalidCount = pendingFiles.filter((f) => !f.valid).length;

  return (
    <div className="space-y-4">
      <input
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        disabled={isUploading}
      />

      <label
        htmlFor="photo-upload"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-all",
          isDragging
            ? "border-gold bg-gold/10"
            : "border-border/50 bg-card hover:border-gold/50 hover:bg-card/80",
          isUploading && "pointer-events-none opacity-60"
        )}
      >
        <div className="mb-4 rounded-full bg-gold/10 p-4">
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          ) : uploadedCount > 0 ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gold" />
          )}
        </div>

        <p className="mb-2 text-lg font-medium text-foreground">
          {isUploading
            ? "Uploading..."
            : uploadedCount > 0
            ? `${uploadedCount} photo(s) uploaded`
            : "Drop your photos here"}
        </p>

        <p className="mb-4 text-sm text-muted-foreground">
          {isDragging ? "Release to add files" : "JPEG, PNG, GIF, WebP • Max 10MB each"}
        </p>

        <Button
          variant="outline"
          size="default"
          disabled={isUploading}
          className="pointer-events-none"
        >
          <Upload className="mr-2 h-4 w-4" />
          Browse Files
        </Button>
      </label>

      {/* File list with validation feedback */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {validCount} valid, {invalidCount} invalid
            </p>
            <Button variant="ghost" size="sm" onClick={clearFiles}>
              Clear all
            </Button>
          </div>

          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/50 bg-card p-2">
            {pendingFiles.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2",
                  item.valid ? "bg-green-500/10" : "bg-red-500/10"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {item.valid ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="truncate text-sm">{item.file.name}</span>
                  {item.error && (
                    <span className="shrink-0 text-xs text-red-500">({item.error})</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={uploadFiles}
            disabled={isUploading || validCount === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload {validCount} Photo{validCount !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </div>
      )}

      {uploadedCount > 0 && pendingFiles.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Your photos are being processed. You'll receive an email when ready.
        </p>
      )}
    </div>
  );
}
