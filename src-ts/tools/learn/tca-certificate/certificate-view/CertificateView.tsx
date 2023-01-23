import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import html2canvas from 'html2canvas'

import {
    FacebookSocialShareBtn,
    fileDownloadCanvasAsImage,
    IconOutline,
    LinkedinSocialShareBtn,
    LoadingSpinner,
    TwitterSocialShareBtn,
    UserProfile,
} from '../../../../lib'
import {
    TCACertificationProviderData,
    UserCompletedTCACertificationsProviderData,
    useGetUserTCACompletedCertificationsMOCK,
    useGetTCACertificationMOCK,
} from '../../learn-lib'
import { getTCACertificationPath, getUserTCACertificateSsr } from '../../learn.routes'

import { ActionButton } from './action-button'
import { Certificate } from './certificate'
import { useCertificateScaling } from './use-certificate-scaling.hook'
import styles from './CertificateView.module.scss'

export type CertificateViewStyle = 'large-container' | undefined

interface CertificateViewProps {
    certification: string,
    hideActions?: boolean,
    onCertificationNotCompleted: () => void
    profile: UserProfile,
    viewStyle: CertificateViewStyle
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {

    const navigate: NavigateFunction = useNavigate()
    const tcaCertificationPath: string = getTCACertificationPath(props.certification)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const userName: string = useMemo(() => (
        [props.profile.firstName, props.profile.lastName].filter(Boolean)
            .join(' ')
        || props.profile.handle
    ), [props.profile.firstName, props.profile.handle, props.profile.lastName])

    const {
        certification,
        ready: certReady,
    }: TCACertificationProviderData = useGetTCACertificationMOCK(props.certification)

    function getCertTitle(user: string): string {
        return `${user} - ${certification?.title} Certification`
    }

    const certUrl: string = getUserTCACertificateSsr(
        props.certification,
        props.profile.handle,
        getCertTitle(props.profile.handle),
    )

    const certificationTitle: string = getCertTitle(userName || props.profile.handle)

    const {
        certifications: [completedCertificate],
        ready: completedCertificateReady,
    }: UserCompletedTCACertificationsProviderData = useGetUserTCACompletedCertificationsMOCK(
        props.profile.userId,
        props.certification,
    )

    const hasCompletedTheCertification: boolean = !!completedCertificate

    const ready: boolean = useMemo(() => (
        completedCertificateReady && certReady
    ), [completedCertificateReady, certReady])

    const readyAndCompletedCertification: boolean = useMemo(() => (
        ready && hasCompletedTheCertification
    ), [hasCompletedTheCertification, ready])

    useCertificateScaling(ready ? certificateWrapRef : undefined)

    const handleBackBtnClick: () => void = useCallback(() => {
        navigate(tcaCertificationPath)
    }, [tcaCertificationPath, navigate])

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
    }, [])

    const handleDownload: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!!canvas) {
            fileDownloadCanvasAsImage(canvas, `${certificationTitle}.png`)
        }

    }, [certificationTitle, getCertificateCanvas])

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

    useEffect(() => {
        if (ready && !hasCompletedTheCertification) {
            props.onCertificationNotCompleted()
        }
    }, [tcaCertificationPath, hasCompletedTheCertification, props, ready])

    return (
        <>
            <LoadingSpinner hide={ready} />

            {ready && readyAndCompletedCertification && (
                <div className={styles.wrap}>
                    <div className={styles['content-wrap']}>
                        {!props.hideActions && (
                            <div className={styles['btns-wrap']}>
                                <ActionButton
                                    icon={<IconOutline.ChevronLeftIcon />}
                                    onClick={handleBackBtnClick}
                                />
                            </div>
                        )}
                        <div
                            className={classNames(styles['certificate-wrap'], props.viewStyle)}
                            ref={certificateWrapRef}
                        >
                            <Certificate
                                course={certification?.title}
                                userName={userName}
                                tcHandle={props.profile.handle}
                                completedDate={completedCertificate?.completedDate ?? ''}
                                elRef={certificateElRef}
                                type={certification?.trackType}
                                viewStyle={props.viewStyle}
                            />
                        </div>
                        {!props.hideActions && (
                            <div className={styles['btns-wrap']}>
                                <ActionButton
                                    icon={<IconOutline.PrinterIcon />}
                                    onClick={handlePrint}
                                />
                                <ActionButton
                                    icon={<IconOutline.DownloadIcon />}
                                    onClick={handleDownload}
                                />
                                <FacebookSocialShareBtn
                                    className={styles['share-btn']}
                                    shareUrl={certUrl}
                                />
                                <LinkedinSocialShareBtn
                                    className={styles['share-btn']}
                                    shareUrl={certUrl}
                                />
                                <TwitterSocialShareBtn
                                    className={styles['share-btn']}
                                    shareUrl={certUrl}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default CertificateView
