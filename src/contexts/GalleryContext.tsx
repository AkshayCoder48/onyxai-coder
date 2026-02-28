import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { GalleryImage } from '../types'
import { useSupabase } from './SupabaseContext'

interface GalleryContextValue {
  images: GalleryImage[]
  loading: boolean
  uploading: boolean
  uploadImage: (file: File, metadata?: { prompt?: string; model?: string }) => Promise<GalleryImage>
  deleteImage: (id: string) => Promise<void>
  getImagesByTag: (tag: string) => GalleryImage[]
  searchImages: (query: string) => GalleryImage[]
  refetch: () => Promise<void>
}

const GalleryContext = createContext<GalleryContextValue | null>(null)

const LOCAL_IMAGES_KEY = 'onyxgpt_gallery_images'

function loadLocalImages(): GalleryImage[] {
  try {
    const raw = localStorage.getItem(LOCAL_IMAGES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalImages(images: GalleryImage[]): void {
  localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(images))
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchImages = useCallback(async () => {
    if (!supabase || !user) {
      setImages(loadLocalImages())
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setImages(data as GalleryImage[])
      saveLocalImages(data as GalleryImage[])
    } finally {
      setLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    fetchImages()
  }, [supabase, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const uploadImage = useCallback(async (
    file: File,
    metadata?: { prompt?: string; model?: string },
  ): Promise<GalleryImage> => {
    setUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      const now = new Date().toISOString()

      // Create image object
      const newImage: GalleryImage = {
        id: crypto.randomUUID(),
        user_id: user?.id ?? 'local',
        filename: file.name,
        url: dataUrl,
        thumbnail_url: null,
        size: file.size,
        mime_type: file.type,
        width: null,
        height: null,
        prompt: metadata?.prompt ?? null,
        model: metadata?.model ?? null,
        tags: [],
        created_at: now,
      }

      if (!supabase || !user) {
        const updated = [newImage, ...images]
        setImages(updated)
        saveLocalImages(updated)
        return newImage
      }

      // Upload to Supabase Storage
      const filePath = `${user.id}/${newImage.id}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl

      // Save metadata to database
      const { data: saved, error } = await supabase
        .from('gallery_images')
        .insert({ ...newImage, url: publicUrl })
        .select()
        .single()

      if (error) throw error
      const image = saved as GalleryImage
      setImages((prev) => [image, ...prev])
      return image
    } finally {
      setUploading(false)
    }
  }, [supabase, user, images])

  const deleteImage = useCallback(async (id: string) => {
    const image = images.find((i) => i.id === id)
    if (!image) return

    if (supabase && user) {
      // Delete from storage if it's a stored path
      if (!image.url.startsWith('data:')) {
        const path = `${user.id}/${id}/${image.filename}`
        await supabase.storage.from('gallery').remove([path])
      }
      const { error } = await supabase.from('gallery_images').delete().eq('id', id)
      if (error) throw error
    }

    const updated = images.filter((i) => i.id !== id)
    setImages(updated)
    saveLocalImages(updated)
  }, [supabase, user, images])

  const getImagesByTag = useCallback((tag: string) => {
    return images.filter((i) => i.tags.includes(tag))
  }, [images])

  const searchImages = useCallback((query: string) => {
    const q = query.toLowerCase()
    return images.filter(
      (i) =>
        i.filename.toLowerCase().includes(q) ||
        (i.prompt && i.prompt.toLowerCase().includes(q)) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [images])

  return (
    <GalleryContext.Provider
      value={{
        images,
        loading,
        uploading,
        uploadImage,
        deleteImage,
        getImagesByTag,
        searchImages,
        refetch: fetchImages,
      }}
    >
      {children}
    </GalleryContext.Provider>
  )
}

export function useGallery(): GalleryContextValue {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error('useGallery must be used within GalleryProvider')
  return ctx
}
