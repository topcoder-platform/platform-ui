const PDF_MIME_TYPE = 'application/pdf'
const OFFICE_MIME_TYPES = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const OFFICE_VIEWER_URL = 'https://view.officeapps.live.com/op/view.aspx?src='
/** How long the PDF blob URL is kept alive so the new tab can load (and reload) it. */
const BLOB_URL_LIFETIME_MS = 10 * 60 * 1000

function getExtension(url: string): string | undefined {
    try {
        const pathname = new URL(url).pathname.toLowerCase()
        const match = pathname.match(/\.([a-z0-9]+)$/)
        return match?.[1]
    } catch {
        return undefined
    }
}

function getOfficeViewerUrl(url: string): string {
    return `${OFFICE_VIEWER_URL}${encodeURIComponent(url)}`
}

function resolveByExtension(url: string): string {
    const extension = getExtension(url)
    return extension === 'doc' || extension === 'docx'
        ? getOfficeViewerUrl(url)
        : url
}

/**
 * Resolves the URL a CV can be previewed at, instead of the browser downloading it.
 *
 * CV files are served by the Filestack CDN with headers that make the browser download them, so a PDF is
 * fetched and exposed through a local blob URL, and DOC / DOCX files go through the Office Online viewer.
 * Filestack URLs carry no file extension, so the type is taken from the fetched file.
 *
 * @param url the CV file URL.
 * @returns the URL to open for previewing the CV; the original URL when no preview is possible.
 */
export async function resolveCvPreviewUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            return resolveByExtension(url)
        }

        const blob = await response.blob()
        const mimeType = blob.type.split(';')[0]
            .trim()
            .toLowerCase()

        if (mimeType === PDF_MIME_TYPE || (!mimeType && getExtension(url) === 'pdf')) {
            const objectUrl = URL.createObjectURL(new Blob([blob], { type: PDF_MIME_TYPE }))
            window.setTimeout(() => URL.revokeObjectURL(objectUrl), BLOB_URL_LIFETIME_MS)
            return objectUrl
        }

        if (OFFICE_MIME_TYPES.includes(mimeType)) {
            return getOfficeViewerUrl(url)
        }
    } catch {
        // CDN unreachable or blocked by CORS: fall back to the file extension.
    }

    return resolveByExtension(url)
}

/**
 * Opens a preview of the CV in a new browser tab.
 *
 * The tab is opened synchronously, while still handling the click, so popup blockers allow it, and is
 * pointed at the preview URL once that is resolved.
 *
 * @param url the CV file URL.
 */
export function openCvPreview(url: string): void {
    const previewWindow = window.open('', '_blank')
    if (!previewWindow) {
        window.open(url, '_blank', 'noopener,noreferrer')
        return
    }

    // Detach the new tab from this page, as `noopener` would; the DOM API requires `null` here.
    // eslint-disable-next-line unicorn/no-null
    previewWindow.opener = null
    previewWindow.document.title = 'CV preview'
    previewWindow.document.body.textContent = 'Loading CV preview...'

    resolveCvPreviewUrl(url)
        .then(previewUrl => {
            previewWindow.location.href = previewUrl
        })
        .catch(() => {
            previewWindow.location.href = url
        })
}
