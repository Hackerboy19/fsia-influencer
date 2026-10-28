// Admin photo upload: the browser shrinks the photo (long side ≤ maxSide, JPEG) and sends it
// to /api/admin/upload, which stores it under /uploads and returns its URL.

export async function shrinkImage(file: File, maxSide = 1600, quality = 0.86): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw new Error("Choose a JPG, PNG or WebP photo.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This photo could not be read."));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser cannot resize photos.");
    ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadImage(token: string, file: File, maxSide?: number): Promise<string> {
  const dataUrl = await shrinkImage(file, maxSide);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ dataUrl })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || typeof data.url !== "string") throw new Error(data.error || "Upload failed. Try again.");
  return data.url;
}
