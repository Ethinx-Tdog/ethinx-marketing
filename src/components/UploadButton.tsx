import { useState, useCallback } from "react";
import { Upload, Loader2, CheckCircle, ImageIcon, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  orderToken: string;
}

interface FileValidation {
  file: File;
  valid: boolean;
  error?: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  thumbnail?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];

function validateFiles(files: FileList | File[]): FileValidation[] {
  return Array.from(files).map((file) => {
    const validation: FileValidation = { file, valid: true, status: "pending", progress: 0 };
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      validation.valid = false;
      validation.error = `Invalid type: ${file.type.split("/")[1] || "unknown"}`;
    } else if (file.size > MAX_FILE_SIZE) {
      validation.valid = false;
      validation.error = `Too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
    }
    
    return validation;
  });
}

function createThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export function UploadButton({ orderToken }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileValidation[]>([]);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const validated = validateFiles(files);
    setPendingFiles((prev) => [...prev, ...validated]);
    
    // Generate thumbnails asynchronously
    for (let i = 0; i < validated.length; i++) {
      const item = validated[i];
      if (item.valid) {
        const thumbnail = await createThumbnail(item.file);
        setPendingFiles((prev) =>
          prev.map((f) => (f.file === item.file ? { ...f, thumbnail } : f))
        );
      }
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setPendingFiles([]);
  }, []);

  const uploadFiles = useCallback(async () => {
    const validFiles = pendingFiles.filter((f) => f.valid && f.status === "pending");
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please add valid image files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    let successCount = 0;

    for (let i = 0; i < pendingFiles.length; i++) {
      const item = pendingFiles[i];
      if (!item.valid || item.status !== "pending") continue;

      // Mark as uploading
      setPendingFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" as const, progress: 10 } : f))
      );

      try {
        // Convert to base64 with progress simulation
        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 30 } : f))
        );

        const base64 = await item.file
          .arrayBuffer()
          .then((b) => btoa(String.fromCharCode(...new Uint8Array(b))));

        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 50 } : f))
        );

        const r = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-photo`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_token: orderToken,
              files: [{ name: item.file.name, type: item.file.type, base64 }],
            }),
          }
        );

        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 90 } : f))
        );

        if (!r.ok) {
          const error = await r.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(error.error || "Upload failed");
        }

        // Mark as done
        setPendingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: "done" as const, progress: 100 } : f))
        );
        successCount++;
      } catch (error) {
        // Mark as error
        setPendingFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "error" as const, progress: 0, error: error instanceof Error ? error.message : "Failed" }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setUploadedCount((prev) => prev + successCount);
      toast({
        title: "Photos uploaded!",
        description: `Successfully uploaded ${successCount} photo(s)`,
      });

      // Clear completed files after a delay
      setTimeout(() => {
        setPendingFiles((prev) => prev.filter((f) => f.status !== "done"));
      }, 2000);
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

  const validPendingCount = pendingFiles.filter((f) => f.valid && f.status === "pending").length;
  const invalidCount = pendingFiles.filter((f) => !f.valid).length;
  const uploadingCount = pendingFiles.filter((f) => f.status === "uploading").length;
  const doneCount = pendingFiles.filter((f) => f.status === "done").length;

  const overallProgress =
    pendingFiles.length > 0
      ? Math.round(pendingFiles.reduce((acc, f) => acc + f.progress, 0) / pendingFiles.length)
      : 0;

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
            ? `Uploading... ${overallProgress}%`
            : uploadedCount > 0
            ? `${uploadedCount} photo(s) uploaded`
            : "Drop your photos here"}
        </p>

        <p className="mb-4 text-sm text-muted-foreground">
          {isDragging ? "Release to add files" : "JPEG, PNG, GIF, WebP • Max 10MB each"}
        </p>

        {!isUploading && (
          <Button variant="outline" size="default" disabled={isUploading} className="pointer-events-none">
            <Upload className="mr-2 h-4 w-4" />
            Browse Files
          </Button>
        )}

        {isUploading && (
          <Progress value={overallProgress} className="h-2 w-full max-w-xs" />
        )}
      </label>

      {/* File list with validation and progress feedback */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {validPendingCount > 0 && `${validPendingCount} ready`}
              {doneCount > 0 && ` • ${doneCount} done`}
              {uploadingCount > 0 && ` • ${uploadingCount} uploading`}
              {invalidCount > 0 && ` • ${invalidCount} invalid`}
            </p>
            {!isUploading && (
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                Clear all
              </Button>
            )}
          </div>

          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border/50 bg-card p-2 sm:grid-cols-3 md:grid-cols-4">
            {pendingFiles.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "group relative overflow-hidden rounded-lg",
                  item.status === "done" && "ring-2 ring-green-500",
                  item.status === "error" && "ring-2 ring-red-500",
                  item.status === "uploading" && "ring-2 ring-gold",
                  !item.valid && item.status === "pending" && "ring-2 ring-red-500"
                )}
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-muted">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Progress overlay */}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
                      <span className="mt-1 block text-xs font-medium text-white">{item.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Status overlay */}
                {item.status === "done" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/30">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                )}

                {(item.status === "error" || (!item.valid && item.status === "pending")) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/30">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                )}

                {/* File info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="truncate text-xs font-medium text-white">{item.file.name}</p>
                  {item.error && (
                    <p className="truncate text-xs text-red-300">{item.error}</p>
                  )}
                </div>

                {/* Remove button */}
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/50 p-0 opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {validPendingCount > 0 && !isUploading && (
            <Button variant="gold" size="lg" className="w-full" onClick={uploadFiles} disabled={isUploading}>
              <Upload className="mr-2 h-5 w-5" />
              Upload {validPendingCount} Photo{validPendingCount !== 1 ? "s" : ""}
            </Button>
          )}
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
