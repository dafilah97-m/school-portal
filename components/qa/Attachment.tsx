import { FileText } from 'lucide-react'

export default function Attachment({ url, type }: { url: string; type: string | null }) {
  if (type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="Attachment" className="mt-2 rounded-lg border max-h-64 object-contain" />
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary underline"
    >
      <FileText size={14} />
      View attachment
    </a>
  )
}
