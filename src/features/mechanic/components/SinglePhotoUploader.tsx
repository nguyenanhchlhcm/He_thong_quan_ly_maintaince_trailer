'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/utils/image-compression'
import { fileToBase64 } from '@/lib/utils/file-helpers'
import Image from 'next/image'

interface SinglePhotoUploaderProps {
  title: string;
  description?: string;
  required?: boolean;
  onPhotoChange: (base64: string | null) => void;
  icon?: React.ReactNode;
}

export function SinglePhotoUploader({ title, description, required = false, onPhotoChange, icon }: SinglePhotoUploaderProps) {
  const [photo, setPhoto] = useState<{ base64: string; url: string } | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsCompressing(true)
      const compressedFile = await compressImage(file)
      const base64Str = await fileToBase64(compressedFile)
      const objectUrl = URL.createObjectURL(compressedFile)
      
      setPhoto({ base64: base64Str, url: objectUrl })
      onPhotoChange(base64Str)
    } catch (error) {
      console.error('Compression failed', error)
      alert('Không thể xử lý ảnh. Vui lòng thử lại.')
    } finally {
      setIsCompressing(false)
    }
  }

  const removePhoto = () => {
    if (photo) URL.revokeObjectURL(photo.url)
    setPhoto(null)
    onPhotoChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={`relative flex flex-col items-center justify-center border-2 ${photo ? 'border-primary border-solid' : 'border-dashed border-slate-700'} rounded-xl p-4 bg-slate-900/50 min-h-[160px] overflow-hidden`}>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" // Hint for mobile to use back camera
        className="hidden"
        ref={inputRef}
        onChange={handleCapture}
      />

      {isCompressing ? (
        <div className="flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
          <span className="text-xs font-medium">Đang nén ảnh...</span>
        </div>
      ) : photo ? (
        <>
          <Image 
            src={photo.url} 
            alt={title} 
            fill 
            className="object-cover opacity-80"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
            <div className="text-xs font-semibold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
              {title}
            </div>
            <Button 
              variant="destructive" 
              size="icon" 
              className="w-8 h-8 rounded-full shadow-lg"
              onClick={removePhoto}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 bg-blue-500/10 text-blue-400">
            {icon || <Camera className="w-6 h-6" />}
          </div>
          <p className="text-sm font-semibold text-slate-300 mb-1">
            {title} {required && <span className="text-red-500">*</span>}
          </p>
          {description && <p className="text-xs text-slate-500 mb-4 px-2">{description}</p>}
          <Button 
            variant="secondary" 
            size="sm" 
            className="bg-slate-800 text-slate-100 hover:bg-slate-700"
            onClick={() => inputRef.current?.click()}
          >
            Chụp ảnh
          </Button>
        </div>
      )}
    </div>
  )
}
