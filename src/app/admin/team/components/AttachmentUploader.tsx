'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Loader2, Plus, FileText, CheckCircle2 } from 'lucide-react';

interface AttachmentUploaderProps {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  maxFiles?: number;
  label?: string;
  helperText?: string;
}

export default function AttachmentUploader({
  attachments,
  onChange,
  maxFiles = 4,
  label = 'Photos & Pièces Jointes',
  helperText = 'Ajoutez des photos, captures d\'écran ou justificatifs (PNG, JPG, WebP max 10MB)',
}: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      setUploadError(`Maximum ${maxFiles} photos autorisées.`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`Le fichier ${file.name} dépasse la limite de 10MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            newUrls.push(data.url);
          }
        }
      }

      if (newUrls.length > 0) {
        onChange([...attachments, ...newUrls]);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Échec du téléchargement du fichier.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <span className="text-[10px] font-mono text-slate-400">
          {attachments.length} / {maxFiles} photo{maxFiles > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grid of uploaded images + upload button */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {attachments.map((url, idx) => (
          <div
            key={idx}
            className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-xs flex items-center justify-center"
          >
            <img
              src={url}
              alt={`Pièce jointe ${idx + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {/* Overlay Remove Button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                title="Supprimer la photo"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {/* Number Pill */}
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
              #{idx + 1}
            </span>
          </div>
        ))}

        {/* Upload Trigger Button */}
        {attachments.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-slate-100/80 transition-all aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer group disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="text-sky-600 animate-spin mb-1" />
                <span className="text-[10px] font-semibold text-slate-600">Chargement...</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-800 mb-1 transition-colors">
                  <Plus size={16} />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">Ajouter Photo</span>
                <span className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, WebP</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {uploadError && (
        <p className="text-[11px] text-rose-600 font-medium">{uploadError}</p>
      )}

      {helperText && (
        <p className="text-[10px] text-slate-400">{helperText}</p>
      )}
    </div>
  );
}
