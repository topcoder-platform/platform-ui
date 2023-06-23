import { MutableRefObject, useCallback } from 'react'

import { useCertificateCanvas } from '../use-certificate-canvas-hook'

export function useCertificatePrint(
    certificateElRef: MutableRefObject<HTMLDivElement | undefined>,
    certificationTitle: string,
): () => Promise<void> {
    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void> = useCertificateCanvas(certificateElRef)

    const handlePrint: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!canvas) {
            return
        }

        const printWindow: Window | null = window.open('')
        if (!printWindow) {
            return
        }

        printWindow.document.body.appendChild(canvas)
        printWindow.document.title = certificationTitle
        printWindow.focus()
        printWindow.print()
    }, [certificationTitle, getCertificateCanvas])

    return handlePrint
}
