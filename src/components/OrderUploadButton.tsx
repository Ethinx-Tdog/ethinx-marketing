import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderUploadButtonProps {
  orderToken: string;
  onUploadComplete?: () => void;
}

export function OrderUploadButton({ orderToken, onUploadComplete }: OrderUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Invalid file",
            description: `${file.name} is not an image`,
            variant: "destructive",
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        // Upload to order-specific path
        const fileName = `${Date.now()}-${file.name}`;
        const path = `raw/${orderToken}/${fileName}`;

        const { error } = await supabase.storage
          .from("uploads")
          .upload(path, file);

        if (error) {
          toast({
            title: "Upload failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setUploadedCount((prev) => prev + 1);
        }
      }

      toast({
        title: "Photos uploaded!",
        description: `Successfully uploaded ${uploadedCount + 1} photo(s)`,
      });

      onUploadComplete?.();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="gold"
        size="lg"
        onClick={handleClick}
        disabled={isUploading}
        className="w-full"
      >
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
      </Button>
    </>
  );
}
