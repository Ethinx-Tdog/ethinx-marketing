import { useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadButtonProps {
  orderToken: string;
}

export function UploadButton({ orderToken }: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const { toast } = useToast();

  async function onFilesSelected(files: FileList) {
    setIsUploading(true);

    try {
      const arr = await Promise.all(
        Array.from(files).map(async (f) => ({
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

      setUploadedCount((prev) => prev + files.length);
      toast({
        title: "Photos uploaded!",
        description: `Successfully uploaded ${files.length} photo(s)`,
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
  }

  return (
    <div className="space-y-4">
      <input
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
        disabled={isUploading}
      />
      <label htmlFor="photo-upload">
        <Button
          variant="gold"
          size="lg"
          className="w-full cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : uploadedCount > 0 ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                {uploadedCount} Uploaded — Add More
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Photos
              </>
            )}
          </span>
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
