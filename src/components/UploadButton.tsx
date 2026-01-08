import { useState, useCallback } from "react";
import { Upload, Loader2, CheckCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadButtonProps {
  orderToken: string;
}

export function UploadButton({ orderToken }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setIsUploading(true);

      try {
        const arr = await Promise.all(
          fileArray.map(async (f) => ({
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

        setUploadedCount((prev) => prev + fileArray.length);
        toast({
          title: "Photos uploaded!",
          description: `Successfully uploaded ${fileArray.length} photo(s)`,
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
    },
    [orderToken, toast]
  );

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

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  return (
    <div className="space-y-4">
      <input
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
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
          {isDragging
            ? "Release to upload"
            : "or click to browse"}
        </p>

        <Button
          variant="gold"
          size="default"
          disabled={isUploading}
          className="pointer-events-none"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : uploadedCount > 0 ? (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Add More Photos
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Select Photos
            </>
          )}
        </Button>
      </label>

      {uploadedCount > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Your photos are being processed. You'll receive an email when ready.
        </p>
      )}
    </div>
  );
}
