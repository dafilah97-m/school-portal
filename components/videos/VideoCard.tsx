import { toEmbedUrl } from '@/lib/video-embed'
import type { EducationalVideo } from '@/lib/types'

export default function VideoCard({ video }: { video: EducationalVideo }) {
  return (
    <div className="border rounded-xl overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-100">
        <iframe
          src={toEmbedUrl(video.video_url)}
          title={video.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="p-4">
        <p className="font-medium">{video.title}</p>
        {video.subject && <p className="text-xs text-gray-500 mt-0.5">{video.subject}</p>}
        {video.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  )
}
