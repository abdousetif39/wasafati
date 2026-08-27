import { useToast } from '../../contexts/ToastContext';
import React, { useState, useRef, useId } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import { compressImage, formatBytes } from '../../lib/compressImage';

interface ImageUploadProps {
  id?: string;
  name?: string;
  value?: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
  className?: string;
  isAvatar?: boolean;
}

export function ImageUpload({
  id: propId,
  name,
  value, onChange, multiple = false, folder = 'uploads', label, className, isAvatar = false }: ImageUploadProps) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  const generatedId = useId();
  const id = propId || generatedId;
  const finalName = name || propId;

  const images: string[] = multiple ? (Array.isArray(value) ? value : []) : (value ? [value as string] : []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate size (max 5MB) and type
    const validFiles = Array.from(files).filter((file: any) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً (الأقصى 5MB)');
        return false;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('نوع الملف غير مدعوم');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;
    
    setUploading(true);
    setProgress(10); // Initial progress

    try {
      // Get signature
      const sigRes = await fetch(`/api/cloudinary-signature?folder=${folder}`);
      if (!sigRes.ok) {
        toast.error('تعذر تجهيز رفع الصورة. تحقق من إعدادات Cloudinary.');
        throw new Error('Failed to get signature');
      }
      const sigData = await sigRes.json();
      
      if (!sigData.cloudName || sigData.cloudName === 'undefined') {
        toast.error('إعدادات رفع الصور غير مكتملة.');
        throw new Error('Cloud name is missing');
      }
      
      const uploadPromises = validFiles.map(async (file: any) => {
        let fileToUpload = file;
        try {
           setUploadStatus('جاري التحضير والضغط...');
           const { file: compressed, originalSize, compressedSize } = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.8,
              maxSizeMB: 1
           });
           fileToUpload = compressed;
           const savings = (((originalSize - compressedSize) / originalSize) * 100).toFixed(0);
           setUploadStatus(`الأصل: ${formatBytes(originalSize)} | الحجم بعد الضغط: ${formatBytes(compressedSize)} (توفير ${savings}%)`);
           // wait 500ms to let user read the status if they want
           await new Promise(r => setTimeout(r, 500));
           setUploadStatus(`جاري الرفع... (${formatBytes(compressedSize)})`);
        } catch (e) {
           if ((e as any)?.code !== 'permission-denied') { console.error("Compression error:", e); }
           throw new Error('فشل ضغط الصورة');
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('api_key', sigData.apiKey);
        formData.append('timestamp', sigData.timestamp);
        formData.append('signature', sigData.signature);
        formData.append('folder', folder);
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error('Upload failed');
        const uploadData = await uploadRes.json();
        return uploadData.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setProgress(100);

      if (multiple) {
        onChange([...images, ...urls]);
      } else {
        onChange(urls[0]);
      }
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error("Upload error:", error); }
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (indexToRemove: number) => {
    // We could delete from Cloudinary here via API, but for simplicity we just remove from state
    if (multiple) {
      onChange(images.filter((_, i) => i !== indexToRemove));
    } else {
      onChange('');
    }
  };

  if (isAvatar) {
    return (
      <div className={cn("relative inline-block", className)}>
        <label htmlFor={id}
          className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer group bg-slate-100 flex items-center justify-center"
          >
          {images[0] ? (
            <img src={images[0]} alt="الصورة الشخصية" className="w-full h-full object-cover" />
          ) : (
             <Camera className="w-10 h-10 text-slate-500" />
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
             {uploading ? (
               <>
                 <Loader2 className="w-8 h-8 animate-spin mb-2" />
                 <span className="text-[10px] text-center px-1 font-medium">{uploadStatus}</span>
               </>
             ) : (
               <>
                 <Camera className="w-8 h-8 mb-1" />
                 <span className="text-xs font-bold">{uploadStatus || 'تغيير الصورة'}</span>
               </>
             )}
          </div>
        </label>
        <input
          id={id}
          name={finalName}
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
        aria-labelledby={label ? `${id}-label` : undefined}
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {label && <span className="block text-sm font-bold text-slate-700" id={`${id}-label`}>{label}</span>}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-slate-100 border border-slate-200">
            <img src={img} alt="معاينة" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        
        {(!value || (multiple) || (!multiple && images.length === 0)) && (
          <label
            htmlFor={id}
            
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-orange-600 relative overflow-hidden"
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 z-10 relative">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <span className="text-xs font-medium text-orange-600">{uploadStatus || `${Math.round(progress)}%`}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">إضافة</span>
              </>
            )}
            
            {uploading && (
              <div 
                className="absolute bottom-0 left-0 h-1 bg-orange-500 transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            )}
          </label>
        )}
      </div>

      <input
        id={id}
        name={finalName}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="text-xs text-slate-500">
        JPG, PNG, WEBP. Max: 5MB
      </div>
    </div>
  );
}
