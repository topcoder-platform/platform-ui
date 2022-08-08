import html2canvas from 'html2canvas'
import { FC, MutableRefObject, useEffect, useMemo, useRef } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    FacebookSocialShareBtn,
    fileDownloadCanvasAsImage,
    IconOutline,
    LinkedinSocialShareBtn,
    LoadingSpinner,
    TwitterSocialShareBtn,
    UserProfile
} from '../../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    useAllCertifications,
    useCourses,
    UserCompletedCertificationsProviderData,
    useUserCompletedCertifications,
} from '../../learn-lib'
import { absoluteRootRoute, getCoursePath } from '../../learn.routes'

import { ActionButton } from './action-button'
import { Certificate } from './certificate'
import styles from './CertificateView.module.scss'
import { useCertificateScaling } from './use-certificate-scaling.hook'

interface CertificateViewProps {
    certification: string,
    hideActions?: boolean,
    onCertificationNotCompleted: () => void
    profile: UserProfile,
    provider: string,
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {
    const navigate: NavigateFunction = useNavigate()
    const { onCertificationNotCompleted }: CertificateViewProps = props
    const coursePath: string = getCoursePath(props.provider, props.certification)
    const certificateElRef: MutableRefObject<HTMLElement | any> = useRef()
    const certificateWrapRef: MutableRefObject<HTMLElement | any> = useRef()

    const userName: string = useMemo(() => (
        [props.profile.firstName, props.profile.lastName].filter(Boolean).join(' ') ||
        props.profile.handle
    ), [props.profile.firstName, props.profile.handle, props.profile.lastName])

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useCourses(props.provider, props.certification)

    const certificationTitle: string = `${userName || props.profile.handle} - ${course?.title} Certification`

    const {
        certifications: [completedCertificate],
        ready: completedCertificateReady,
    }: UserCompletedCertificationsProviderData = useUserCompletedCertifications(
        props.profile.userId,
        props.provider,
        props.certification
    )
    const hasCompletedTheCertification: boolean = !!completedCertificate

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useAllCertifications(props.provider, course?.certificationId)

    const ready: boolean = useMemo(() => (
        completedCertificateReady && courseReady && certificateReady
    ), [certificateReady, completedCertificateReady, courseReady])

    const readyAndCompletedCertification: boolean = useMemo(() => (
        ready && hasCompletedTheCertification
    ), [hasCompletedTheCertification, ready])

    useCertificateScaling(ready ? certificateWrapRef : undefined)

    function handleBackBtnClick(): void {
        navigate(coursePath)
    }

    async function getCertificateCanvas(): Promise<HTMLCanvasElement | void> {
        if (!certificateElRef.current) {
            return
        }

        return html2canvas(certificateElRef.current, {
            // when canvas iframe is ready, remove text gradients as they're not supported in html2canvas
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
    }

    async function handleDownload(): Promise<void> {
        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!canvas) {
            return
        }
        fileDownloadCanvasAsImage(canvas, `${certificationTitle}.png`)
    }

    async function handlePrint(): Promise<void> {
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
    }

    useEffect(() => {
        if (ready && !hasCompletedTheCertification) {
            onCertificationNotCompleted()
        }
    }, [
        coursePath,
        hasCompletedTheCertification,
        onCertificationNotCompleted,
        ready,
    ])

    return (
        <>
            <LoadingSpinner hide={ready} />

            {readyAndCompletedCertification && (
                <div className={styles['wrap']}>
                    <div className={styles['content-wrap']}>
                        {!props.hideActions && (
                            <div className={styles['btns-wrap']}>
                                <ActionButton
                                    icon={<IconOutline.ChevronLeftIcon />}
                                    onClick={handleBackBtnClick}
                                />
                            </div>
                        )}
                        <div className={styles['certificate-wrap']} ref={certificateWrapRef}>
                            <Certificate
                                course={course?.title}
                                userName={userName}
                                tcHandle={props.profile.handle}
                                provider={course?.provider}
                                completedDate={completedCertificate?.completedDate ?? ''}
                                elRef={certificateElRef}
                                type={certificate?.trackType}
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
                                    shareUrl={absoluteRootRoute}
                                />
                                <LinkedinSocialShareBtn
                                    className={styles['share-btn']}
                                    shareUrl={absoluteRootRoute}
                                />
                                <TwitterSocialShareBtn
                                    className={styles['share-btn']}
                                    shareUrl={absoluteRootRoute}
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
