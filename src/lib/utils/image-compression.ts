import imageCompression from 'browser-image-compression'

export const compressImage = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.1, // Max 100KB to enforce Rule 7
    maxWidthOrHeight: 800, // Reasonable resolution for visual proof
    useWebWorker: true,
    fileType: 'image/webp', // Modern format
  }

  try {
    const compressedFile = await imageCompression(file, options)
    
    // Fallback if browser doesn't support webp encoding properly via the library
    if (compressedFile.size > file.size) {
       console.warn('Compressed file is larger than original. Using original.')
       return file
    }

    return compressedFile
  } catch (error) {
    console.error('Error compressing image:', error)
    throw error
  }
}
