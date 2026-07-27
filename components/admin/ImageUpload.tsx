'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { Loader2, X } from 'lucide-react'

export default function ImageUpload({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    async (files: File[]) => {
      setUploading(true)
      const uploaded: string[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/admin/shop/upload-image', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) uploaded.push(data.url)
        else toast.error(data.error || 'Upload failed')
      }
      onChange([...images, ...uploaded])
      setUploading(false)
    },
    [images, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center text-sm cursor-pointer ${
          isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="animate-spin mx-auto" size={20} />
        ) : (
          <p className="text-gray-500">Drag images here, or click to select</p>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((u) => u !== url))}
                className="absolute top-0 right-0 bg-black/60 text-white p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
