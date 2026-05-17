/**
 * Helper to compress image file client-side using HTML5 Canvas.
 * Downsizes image if dimensions exceed maxWidth/maxHeight, and applies JPEG quality compression.
 */
export async function compressImage(file: File, quality: number = 0.7, maxDimension: number = 1200): Promise<File> {
  // If not an image, return original file
  if (!file.type.startsWith('image/')) {
    return file
  }

  // Skip compression for very small images (under 100KB)
  if (file.size < 100 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Downscale maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file) // Fallback if canvas context fails
          return
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to blob (JPEG quality compression)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }
            // Create a new File from the blob
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => {
        resolve(file) // Fallback on image load error
      }
    }
    reader.onerror = () => {
      resolve(file) // Fallback on reader error
    }
  })
}
