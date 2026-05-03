'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { compressImage } from '@/lib/utils/image-compression'
import { fileToBase64 } from '@/lib/utils/file-helpers'
import Image from 'next/image'

interface PhotoUploaderProps {
  onPhotosChange: (photos: { oldPartBase64: string | null; newPartBase64: string | null }) => void
}

export function PhotoUploader({ onPhotosChange }: PhotoUploaderProps) {
  const [oldPhoto, setOldPhoto] = useState<{ base64: string; url: string } | null>(null)
  const [newPhoto, setNewPhoto] = useState<{ base64: string; url: string } | null>(null)
  const [isCompressingOld, setIsCompressingOld] = useState(false)
  const [isCompressingNew, setIsCompressingNew] = useState(false)

  const oldInputRef = useRef<HTMLInputElement>(null)
  const newInputRef = useRef<HTMLInputElement>(null)

  const handleCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'old' | 'new'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const setCompressing = type === 'old' ? setIsCompressingOld : setIsCompressingNew
    const setPhotoState = type === 'old' ? setOldPhoto : setNewPhoto

    try {
      setCompressing(true)
      console.log(`Original ${type} size:`, (file.size / 1024).toFixed(2), 'KB')
      
      const compressedFile = await compressImage(file)
      console.log(`Compressed ${type} size:`, (compressedFile.size / 1024).toFixed(2), 'KB')

      const base64Str = await fileToBase64(compressedFile)
      const objectUrl = URL.createObjectURL(compressedFile)
      
      setPhotoState({ base64: base64Str, url: objectUrl })
      
      // Update parent
      onPhotosChange({
        oldPartBase64: type === 'old' ? base64Str : oldPhoto?.base64 || null,
        newPartBase64: type === 'new' ? base64Str : newPhoto?.base64 || null,
      })

    } catch (error) {
      console.error('Compression failed', error)
      alert('Không thể xử lý ảnh. Vui lòng thử lại.')
    } finally {
      setCompressing(false)
    }
  }

  const removePhoto = (type: 'old' | 'new') => {
    if (type === 'old') {
      if (oldPhoto) URL.revokeObjectURL(oldPhoto.url)
      setOldPhoto(null)
      onPhotosChange({ oldPartBase64: null, newPartBase64: newPhoto?.base64 || null })
      if (oldInputRef.current) oldInputRef.current.value = ''
    } else {
      if (newPhoto) URL.revokeObjectURL(newPhoto.url)
      setNewPhoto(null)
      onPhotosChange({ oldPartBase64: oldPhoto?.base64 || null, newPartBase64: null })
      if (newInputRef.current) newInputRef.current.value = ''
    }
  }

  const renderCaptureBox = (
    type: 'old' | 'new', 
    title: string, 
    photo: { base64: string; url: string } | null, 
    isCompressing: boolean,
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    const isOld = type === 'old'
    
    return (
      <div className={`relative flex flex-col items-center justify-center border-2 ${photo ? 'border-primary border-solid' : 'border-dashed border-slate-700'} rounded-xl p-4 bg-slate-900/50 min-h-[160px] overflow-hidden`}>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" // Hint for mobile to use back camera
          className="hidden"
          ref={inputRef}
          onChange={(e) => handleCapture(e, type)}
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
                onClick={() => removePhoto(type)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${isOld ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mb-1">{title}</p>
            <p className="text-xs text-slate-500 mb-4 px-2">Bắt buộc để nghiệm thu</p>
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

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      {renderCaptureBox('old', 'Vật tư CŨ', oldPhoto, isCompressingOld, oldInputRef)}
      {renderCaptureBox('new', 'Vật tư MỚI', newPhoto, isCompressingNew, newInputRef)}
    </div>
  )
}
