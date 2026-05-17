import imageCompression from 'browser-image-compression'
import { compressImage as canvasCompress } from './imageCompressor'

/**
 * Converts a File object to a Base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

/**
 * Converts a Base64 string back to a File object
 */
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}

/**
 * Compresses an image file and converts it to WebP format
 * Max size enforced: 100KB (Lean & Efficient)
 * Falls back to native Canvas-based compression if worker fails.
 */
export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, // Max 100KB
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/webp',
  }

  try {
    const compressedFile = await imageCompression(file, options)
    
    if (compressedFile.size > file.size) {
       console.warn('Compressed file is larger than original. Using original.')
       return file
    }

    return compressedFile
  } catch (error) {
    console.warn('browser-image-compression worker failed, falling back to native Canvas compression...', error)
    try {
      const fallbackFile = await canvasCompress(file, 0.7, 800)
      return fallbackFile
    } catch (fallbackError) {
      console.error('Canvas fallback compression failed too:', fallbackError)
      return file // Ultimate fallback: original file
    }
  }
}

