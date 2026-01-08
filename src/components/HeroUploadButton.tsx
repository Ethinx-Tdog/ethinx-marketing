import { useRef, useState } from 'react';
import { ArrowRight, Upload, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotoUpload } from '@/hooks/usePhotoUpload';

interface UploadButtonProps {
  variant?: 'gold' | 'default';
  size?: 'default' | 'lg' | 'xl';
  className?: string;
}

export function HeroUploadButton({ variant = 'gold', size = 'xl', className }: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, isUploading, uploadProgress } = usePhotoUpload();
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Upload files one by one
    for (const file of Array.from(files)) {
      const result = await uploadPhoto(file);
      if (result.success) {
        setUploadedCount(prev => prev + 1);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading... {uploadProgress}%
          </>
        ) : uploadedCount > 0 ? (
          <>
            <CheckCircle className="h-5 w-5" />
            {uploadedCount} Uploaded — Add More
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            Upload Photos
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>
    </>
  );
}
