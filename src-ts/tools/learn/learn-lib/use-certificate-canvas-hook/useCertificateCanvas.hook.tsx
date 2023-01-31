import { MutableRefObject, useCallback } from 'react'
import html2canvas from 'html2canvas'

export function useCertificateCanvas(
    certificateElRef: MutableRefObject<HTMLDivElement | undefined>,
): () => Promise<HTMLCanvasElement | void> {
    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void> = useCallback(async () => {

        if (!certificateElRef.current) {
            return undefined
        }

        return html2canvas(certificateElRef.current, {
            // when canvas iframe is ready, remove text gradients
            // as they're not supported in html2canvas
            onclone: (doc: Document) => {
                [].forEach.call(doc.querySelectorAll('.grad'), (el: HTMLDivElement) => {
                    el.classList.remove('grad')
                })
            },
            // scale (pixelRatio) doesn't matter for the final ceriticate, use 1
            scale: 1,
            // use the same (ideal) window size when rendering the certificate
            windowHeight: 700,
            windowWidth: 1024,
        })
    }, [certificateElRef])

    return getCertificateCanvas
}
