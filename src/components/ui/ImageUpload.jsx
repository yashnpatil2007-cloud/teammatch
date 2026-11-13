import { useState, useRef, useEffect } from 'react';
import { Upload, X, RefreshCw, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { resolveFileUrl, errMsg } from '../../services/api';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const DEFAULT_MAX_SIZE_MB = 5;

/**
 * Reusable ImageUpload Component for TeamMatch
 *
 * Supports:
 * - Device file picker
 * - Drag-and-drop
 * - JPG, JPEG, PNG, WEBP validation
 * - 5 MB file size limit
 * - Real-time preview with fallback resolution
 * - Upload progress indicator
 * - Change / Replace & Remove actions
 * - Aspect ratios: 'banner' (wide 16:9/3:1), 'avatar' (circular/square), 'standard' (4:3)
 */
export default function ImageUpload({
  value = '',
  onChange,
  onUpload,
  onRemove,
  label = 'Upload Image',
  hint = 'Supports JPG, PNG, WEBP up to 5 MB.',
  aspectRatio = 'standard',
  disabled = false,
  className = '',
  required = false,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [localPreview, setLocalPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (localPreview && localPreview.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const activeImage = localPreview || (value ? resolveFileUrl(value) : '');

  const validateFile = (file) => {
    if (!file) return 'No file selected';

    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const mimeOk = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const extOk = ALLOWED_EXTENSIONS.includes(ext);

    if (!mimeOk && !extOk) {
      return `Invalid format (${ext || file.type}). Please select a JPG, PNG, or WEBP image.`;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return `File size (${sizeMB} MB) exceeds maximum allowed size of ${maxSizeMB} MB.`;
    }

    return null;
  };

  const handleFile = async (file) => {
    if (!file || disabled) return;

    setError('');
    setSuccessMsg('');

    const validationErr = validateFile(file);
    if (validationErr) {
      setError(validationErr);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Generate local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    if (typeof onUpload === 'function') {
      setUploading(true);
      setProgress(10);
      try {
        const result = await onUpload(file, (progressEvent) => {
          if (progressEvent && progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(Math.min(95, pct));
          }
        });

        setProgress(100);
        const uploadedUrl = typeof result === 'string' ? result : (result?.url || result?.bannerUrl || result?.logoUrl || result?.photoUrl || result?.imageUrl || '');
        if (onChange && uploadedUrl) {
          onChange(uploadedUrl, result);
        }
        setSuccessMsg('Image uploaded successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setError(errMsg(err) || 'Failed to upload image. Please try again.');
        setLocalPreview('');
      } finally {
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else if (onChange) {
      // If no onUpload handler provided, pass file or local preview to parent
      onChange(objectUrl, { file });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading) return;

    setError('');
    setSuccessMsg('');
    if (localPreview && localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview('');

    try {
      if (typeof onRemove === 'function') {
        await onRemove();
      }
      if (onChange) {
        onChange('', null);
      }
      setSuccessMsg('Image removed.');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err) {
      setError(errMsg(err) || 'Failed to remove image.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Shape / Aspect Ratio styling
  const isAvatar = aspectRatio === 'avatar';
  const isBanner = aspectRatio === 'banner';

  const containerClasses = [
    'relative flex flex-col items-center justify-center transition-all duration-200 border-2 border-dashed rounded-2xl',
    dragActive
      ? 'border-[#6C63FF] bg-[#6C63FF]/5 scale-[1.01]'
      : 'border-[var(--border)] hover:border-[#6C63FF]/50 bg-[var(--surface)]/40',
    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
    isAvatar ? 'w-32 h-32 mx-auto rounded-full overflow-hidden' : isBanner ? 'w-full min-h-[160px] sm:min-h-[200px]' : 'w-full min-h-[140px]',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-2 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-[12px] font-semibold text-[var(--text-secondary)]">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {activeImage && !uploading && (
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Active image loaded
            </span>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        disabled={disabled || uploading}
        className="hidden"
      />

      {/* Upload Dropzone / Preview Area */}
      <div
        className={containerClasses}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !uploading && fileInputRef.current) {
            fileInputRef.current.click();
          }
        }}
      >
        {activeImage ? (
          <div className="relative w-full h-full min-h-[160px] flex items-center justify-center overflow-hidden rounded-2xl group">
            <img
              src={activeImage}
              alt="Uploaded visual preview"
              className={isAvatar ? 'w-full h-full object-cover' : 'w-full h-full max-h-[260px] object-cover'}
              onError={() => {
                setError('Failed to display the selected image. Please try uploading again.');
              }}
            />
            {/* Overlay on hover for easy actions */}
            {!uploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3 text-white">
                <p className="text-[12px] font-semibold flex items-center gap-1.5">
                  <Upload className="w-4 h-4" /> Click or drop to change image
                </p>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition backdrop-blur-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={disabled}
                    className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-medium transition backdrop-blur-xs flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#6C63FF]/10 text-[#6C63FF] mx-auto flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                Click to upload <span className="font-normal text-[var(--text-secondary)]">or drag & drop</span>
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                PNG, JPG, or WEBP (Max {maxSizeMB} MB)
              </p>
            </div>
          </div>
        )}

        {/* Uploading Spinner & Overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center text-white gap-2 p-4 z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-white" />
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-medium">
                <span>Uploading image...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#6C63FF] to-[#60A5FA] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* External Action Bar if image is present */}
      {activeImage && !uploading && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-[12px] h-8"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Change Photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-[12px] h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          </div>
          {hint && <span className="text-[11px] text-[var(--text-secondary)]">{hint}</span>}
        </div>
      )}

      {!activeImage && hint && (
        <p className="text-[11px] text-[var(--text-secondary)]">{hint}</p>
      )}

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="p-1 hover:bg-red-500/20 rounded-md"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[12px]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </div>
  );
}
