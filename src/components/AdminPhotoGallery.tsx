import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Upload, Star, ArrowLeft, ArrowRight, Trash2, Plus, Loader2 } from "lucide-react";
import { uploadImage } from "../lib/adminUpload";

// Admin creator form: the main profile photo plus the gallery shown on the profile.
// Photos can be uploaded (resized in the browser) or added by link, reordered and removed.

const MAX_PHOTOS = 12;

export default function AdminPhotoGallery({
  token,
  image,
  photos,
  onChange
}: {
  token: string;
  image: string;
  photos: string[];
  onChange: (next: { image: string; photos: string[] }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLInputElement>(null);

  const all = photos.filter(Boolean);

  const addFiles = async (files: FileList | null, asMain = false) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const room = asMain ? 1 : MAX_PHOTOS - all.length;
      const added: string[] = [];
      for (const file of Array.from(files).slice(0, Math.max(0, room))) {
        added.push(await uploadImage(token, file, 1600));
      }
      if (asMain && added[0]) onChange({ image: added[0], photos: all });
      else onChange({ image: image || added[0] || "", photos: [...all, ...added] });
      if (!asMain && files.length > room) toast(`Only ${MAX_PHOTOS} photos fit in a gallery.`);
      if (added.length) toast.success(added.length === 1 ? "Photo uploaded." : `${added.length} photos uploaded.`);
    } catch (e: any) {
      toast.error(e?.message || "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (mainRef.current) mainRef.current.value = "";
    }
  };

  const addLink = () => {
    const u = link.trim();
    if (!/^(https?:\/\/|\/)/i.test(u)) return toast.error("Paste a full image link starting with https://");
    if (all.length >= MAX_PHOTOS) return toast.error(`A gallery holds ${MAX_PHOTOS} photos.`);
    onChange({ image: image || u, photos: [...all, u] });
    setLink("");
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= all.length) return;
    const next = [...all];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ image, photos: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="field-label !mb-0">Main profile photo</p>
        <div className="flex items-center gap-3">
          <span className="w-16 h-20 shrink-0 rounded-[3px] bg-sunken overflow-hidden border border-line">
            {image && <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
          </span>
          <div className="flex-1 min-w-0 space-y-2">
            <input
              type="text"
              value={image}
              placeholder="Upload a photo or paste a link"
              onChange={(e) => onChange({ image: e.target.value, photos: all })}
              className="field"
              aria-label="Main photo link"
            />
            <input ref={mainRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => addFiles(e.target.files, true)} />
            <button type="button" onClick={() => mainRef.current?.click()} disabled={busy} className="btn btn-secondary btn-sm">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} Upload main photo
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <p className="field-label !mb-0">Photo gallery on the profile</p>
          <span className="text-[0.75rem] text-ink-3 tabular-nums">{all.length}/{MAX_PHOTOS}</span>
        </div>
        {all.length > 0 ? (
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {all.map((src, i) => (
              <li key={src + i} className="relative group border border-line rounded-[3px] overflow-hidden bg-sunken">
                <img src={src} alt={`Gallery photo ${i + 1}`} className="w-full aspect-[4/5] object-cover" referrerPolicy="no-referrer" />
                {src === image && <span className="absolute top-1 left-1 bg-bronze-fill text-white text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-[2px]">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/95 border-t border-line">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="p-1.5 disabled:opacity-30 cursor-pointer"><ArrowLeft className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => onChange({ image: src, photos: all })} aria-label="Use as main photo" title="Use as main photo" className="p-1.5 cursor-pointer"><Star className={`w-3.5 h-3.5 ${src === image ? "fill-current text-bronze" : ""}`} /></button>
                  <button type="button" onClick={() => onChange({ image: image === src ? all.find((p) => p !== src) || "" : image, photos: all.filter((_, k) => k !== i) })} aria-label="Remove photo" className="p-1.5 text-[#a33] cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === all.length - 1} aria-label="Move right" className="p-1.5 disabled:opacity-30 cursor-pointer"><ArrowRight className="w-3.5 h-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[0.875rem] text-ink-3 border border-dashed border-line-strong rounded-[3px] p-4 text-center">No gallery photos yet.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => addFiles(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy || all.length >= MAX_PHOTOS} className="btn btn-primary btn-sm">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />} Upload photos
          </button>
          <div className="flex flex-1 min-w-[14rem] gap-2">
            <input type="text" value={link} onChange={(e) => setLink(e.target.value)} placeholder="…or paste a photo link" className="field !h-9 flex-1 min-w-0" aria-label="Photo link" />
            <button type="button" onClick={addLink} className="btn btn-secondary btn-sm"><Plus className="w-4 h-4" aria-hidden="true" /> Add</button>
          </div>
        </div>
        <p className="text-[0.8125rem] text-ink-3">Upload only photos the creator sent you or allowed you to use. Photos are resized automatically.</p>
      </div>
    </div>
  );
}
