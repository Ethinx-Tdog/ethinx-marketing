export function OrderUploadInput({ orderToken }: { orderToken: string }) {
  async function onFilesSelected(files: FileList) {
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

    if (!r.ok) alert("Upload failed");
  }

  return (
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => e.target.files && onFilesSelected(e.target.files)}
    />
  );
}
