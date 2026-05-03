import { supabase } from './client'

/**
 * Uploads a base64 image string to Supabase Storage.
 * @param bucket The name of the storage bucket (e.g., 't2m-evidence')
 * @param path The folder path and filename (e.g., 'tires/serial_123.jpg')
 * @param base64String The base64 string of the image (can include data:image/jpeg;base64, prefix)
 * @returns The public URL of the uploaded image
 */
export async function uploadBase64Image(bucket: string, path: string, base64String: string): Promise<string> {
  // Remove the data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '')
  
  // Convert base64 to binary ArrayBuffer
  const binaryString = window.atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Determine content type (default to webp since our compress logic outputs webp/jpeg)
  const contentType = base64String.match(/^data:(image\/\w+);base64,/) ? 
    base64String.match(/^data:(image\/\w+);base64,/)?.[1] : 'image/jpeg'

  const fileBlob = new Blob([bytes], { type: contentType || 'image/jpeg' })

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, fileBlob, {
      contentType: contentType || 'image/jpeg',
      upsert: true,
      cacheControl: '3600'
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)

  return publicUrlData.publicUrl
}
