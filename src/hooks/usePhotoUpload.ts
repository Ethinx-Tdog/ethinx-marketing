import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadResult {
  success: boolean;
  fileName?: string;
  path?: string;
  signedUrl?: string;
  error?: string;
}

export function usePhotoUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadPhoto = async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB');
      }

      setUploadProgress(25);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(50);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('upload-photo', {
        body: formData,
      });

      setUploadProgress(100);

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: 'Photo uploaded!',
        description: 'Your photo has been uploaded successfully.',
      });

      return {
        success: true,
        fileName: data.fileName,
        path: data.path,
        signedUrl: data.signedUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
      return { success: false, error: message };
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (bucket: 'uploads' | 'processed', fileName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-signed-url', {
        body: { bucket, fileName },
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Failed to get URL');
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  return {
    uploadPhoto,
    getSignedUrl,
    isUploading,
    uploadProgress,
  };
}
