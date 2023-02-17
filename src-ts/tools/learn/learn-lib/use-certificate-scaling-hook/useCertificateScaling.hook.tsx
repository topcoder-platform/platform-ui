import { MutableRefObject, useEffect } from 'react'

export function useCertificateScaling(
    certificateRef?: MutableRefObject<HTMLDivElement | undefined>,
    originalSizeLg: number = 1250,
    originalSizeSm: number = 975,
): void {

    // the certificate isn't responsive: should look the same on mobile and desktop
    // add resize event listener to downscale the certificate
    useEffect(() => {
        function handleResize(): void {
            if (!certificateRef?.current) {
                return
            }

            const certificateEl: HTMLDivElement = certificateRef.current
            const parentWidth: number = certificateEl?.offsetWidth ?? 0
            // 975 and 1250 are the original container sizes,
            // and we're dividing by that to get the needed zoom level
            const ratioSize: number = window.innerWidth <= 745 ? originalSizeSm : originalSizeLg
            const scaleLevel: number = Math.min(1, parentWidth / ratioSize)
            Object.assign(certificateEl.style, { transform: `scale(${scaleLevel})`, transformOrigin: '0 0' })
        }

        window.addEventListener('resize', handleResize, false)
        handleResize()
        return () => window.removeEventListener('resize', handleResize, false)
    }, [certificateRef, originalSizeLg, originalSizeSm])
}
