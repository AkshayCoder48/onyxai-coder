import { useState, useRef, useMemo } from 'react'
import { useGallery } from '../contexts/GalleryContext'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import {
  Image,
  Upload,
  Search,
  Trash2,
  Download,
  Copy,
  Grid,
  List,
} from 'lucide-react'
import type { GalleryImage } from '../types'
import toast from 'react-hot-toast'

export function GalleryPage() {
  const { images, loading, uploading, uploadImage, deleteImage, searchImages } = useGallery()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const filteredImages = useMemo(() => {
    if (!searchQuery) return images
    return searchImages(searchQuery)
  }, [images, searchQuery, searchImages])

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    try {
      await uploadImage(file)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error('Failed to upload image')
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFileSelect(e.dataTransfer.files)
  }

  const handleDownload = async (image: GalleryImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = image.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Downloaded')
    } catch {
      toast.error('Failed to download')
    }
  }

  const handleCopyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url)
    toast.success('URL copied')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    try {
      await deleteImage(id)
      if (selectedImage?.id === id) {
        setPreviewOpen(false)
        setSelectedImage(null)
      }
      toast.success('Image deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Image size={20} className="text-onyx-400" />
            Image Gallery
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Store and manage your images
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files)}
            accept="image/*"
            className="hidden"
          />
          <Button onClick={() => fileInputRef.current?.click()} size="sm" loading={uploading}>
            <Upload size={16} />
            Upload
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-onyx-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'grid'
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-colors',
              viewMode === 'list'
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto p-6"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-onyx-900/80 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-onyx-500 m-4 rounded-2xl">
            <div className="text-center">
              <Upload size={48} className="text-onyx-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-white">Drop image here</p>
              <p className="text-sm text-gray-400">to upload</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
              <Image size={28} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-1">No images yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              Upload images to your gallery. You can drag and drop images here.
            </p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload size={16} />
              Upload your first image
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-gray-700 cursor-pointer"
                onClick={() => {
                  setSelectedImage(image)
                  setPreviewOpen(true)
                }}
              >
                <img
                  src={image.thumbnail_url ?? image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white truncate">{image.filename}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(image.size)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className="flex items-center gap-4 p-3 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 group"
              >
                <div
                  className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden shrink-0 cursor-pointer"
                  onClick={() => {
                    setSelectedImage(image)
                    setPreviewOpen(true)
                  }}
                >
                  <img
                    src={image.thumbnail_url ?? image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{image.filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)} • {new Date(image.created_at).toLocaleDateString()}
                  </p>
                  {image.prompt && (
                    <p className="text-xs text-gray-600 line-clamp-1 mt-1">{image.prompt}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyUrl(image.url)}
                    className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDownload(image)}
                    className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedImage?.filename}
        size="xl"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="bg-gray-950 rounded-xl overflow-hidden">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="max-h-[60vh] mx-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Filename:</span>
                <span className="ml-2 text-gray-300">{selectedImage.filename}</span>
              </div>
              <div>
                <span className="text-gray-500">Size:</span>
                <span className="ml-2 text-gray-300">{formatFileSize(selectedImage.size)}</span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 text-gray-300">{selectedImage.mime_type}</span>
              </div>
              <div>
                <span className="text-gray-500">Uploaded:</span>
                <span className="ml-2 text-gray-300">
                  {new Date(selectedImage.created_at).toLocaleString()}
                </span>
              </div>
              {selectedImage.prompt && (
                <div className="col-span-2">
                  <span className="text-gray-500">Prompt:</span>
                  <p className="mt-1 text-gray-300 bg-gray-900 p-3 rounded-lg text-xs">{selectedImage.prompt}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleCopyUrl(selectedImage.url)}
              >
                <Copy size={16} />
                Copy URL
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleDownload(selectedImage)}
              >
                <Download size={16} />
                Download
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(selectedImage.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
