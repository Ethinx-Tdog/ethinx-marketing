import { useState, useEffect } from "react";
import { Download, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ResultsGalleryProps {
  token: string;
  files: string[];
}

export function ResultsGallery({ token, files }: ResultsGalleryProps) {
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [zipUrl, setZipUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSignedUrls = async () => {
      if (!files.length) {
        setIsLoading(false);
        return;
      }

      try {
        const urls: Record<string, string> = {};

        for (const file of files) {
          const { data } = await supabase.functions.invoke("get-signed-url", {
            body: { key: `results/${token}/${file}` },
          });
          if (data?.signedUrl) {
            urls[file] = data.signedUrl;
          }
        }

        setSignedUrls(urls);

        // Get zip URL
        const { data: zipData } = await supabase.functions.invoke("get-signed-url", {
          body: { key: `zips/${token}.zip` },
        });
        if (zipData?.signedUrl) {
          setZipUrl(zipData.signedUrl);
        }
      } catch (error) {
        console.error("Failed to fetch signed URLs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrls();
  }, [token, files]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!files.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-8 text-center">
        <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No results available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Download all button */}
      {zipUrl && (
        <div className="flex justify-center">
          <Button variant="gold" size="lg" asChild>
            <a href={zipUrl} download>
              <Download className="mr-2 h-5 w-5" />
              Download All ({files.length} photos)
            </a>
          </Button>
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {files.map((file) => (
          <div
            key={file}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-card"
          >
            {signedUrls[file] ? (
              <>
                <img
                  src={signedUrls[file]}
                  alt={file}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <a
                  href={signedUrls[file]}
                  download={file}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Download className="h-8 w-8 text-white" />
                </a>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
