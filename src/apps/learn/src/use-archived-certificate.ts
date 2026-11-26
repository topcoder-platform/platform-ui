import { useEffect } from 'react'

import { LearnConfig } from './config'
import { getUserCertificateSsr } from './learn.routes'

// Some awards from the original Academy exist only as public certificate images.
// A lookup failure by itself must never be treated as an earned certificate.
export function useArchivedCertificate(missing: boolean, provider: string, slug: string, handle?: string): void {
    useEffect(() => {
        if (!missing || !handle || !slug || !provider) return undefined

        const image: HTMLImageElement = new Image()
        const encodedHandle: string = encodeURIComponent(handle)
        const key: string = `${encodedHandle}/${encodeURIComponent(provider)}/${encodeURIComponent(slug)}`
        function openArchivedCopy(): void {
            window.location.replace(getUserCertificateSsr(
                encodeURIComponent(provider),
                encodeURIComponent(slug),
                encodedHandle,
                'Archived Topcoder Academy Certificate',
            ))
        }

        image.addEventListener('load', openArchivedCopy)
        image.src = `${LearnConfig.CERT_IMAGE_ORIGIN}/certificate/${key}.jpg`
        return () => image.removeEventListener('load', openArchivedCopy)
    }, [missing, provider, slug, handle])
}
