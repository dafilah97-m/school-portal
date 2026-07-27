// Converts a YouTube/Vimeo watch/share URL into an embeddable iframe src.
// Falls back to the original URL if the host isn't recognized.
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url)

    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v')
      if (id) return `https://www.youtube.com/embed/${id}`
      if (u.pathname.startsWith('/embed/')) return url
    }

    if (u.hostname === 'youtu.be') {
      const id = u.pathname.replace('/', '')
      if (id) return `https://www.youtube.com/embed/${id}`
    }

    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop()
      if (id) return `https://player.vimeo.com/video/${id}`
    }

    return url
  } catch {
    return url
  }
}
