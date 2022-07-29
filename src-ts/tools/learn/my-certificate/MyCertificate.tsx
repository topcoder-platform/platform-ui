import html2canvas from 'html2canvas'
import { FC, MutableRefObject, useContext, useEffect, useMemo, useRef } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    FacebookSocialShareBtn,
    fileDownloadCanvasAsImage,
    IconOutline,
    LinkedinSocialShareBtn,
    LoadingSpinner,
    profileContext,
    ProfileContextData,
    TwitterSocialShareBtn
} from '../../../lib'
import {
    AllCertificationsProviderData,
    CoursesProviderData,
    useAllCertifications,
    useCourses,
    UserCertificationProgressProviderData,
    UserCertificationProgressStatus,
    useUserCertificationProgress,
} from '../learn-lib'
import { absoluteRootRoute, getCoursePath } from '../learn.routes'

import { ActionButton } from './action-button'
import { Certificate } from './certificate'
import styles from './MyCertificate.module.scss'
import { useCertificateScaling } from './use-certificate-scaling.hook'

const MyCertificate: FC<{}> = () => {

    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''
    const coursePath: string = getCoursePath(providerParam, certificationParam)
    const certificateElRef: MutableRefObject<HTMLElement | any> = useRef()
    const certificateWrapRef: MutableRefObject<HTMLElement | any> = useRef()
    const userName: string = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useCourses(providerParam, certificationParam)

    const certificationTitle: string = `${userName} - ${course?.title} Certification`

    const {
        certificationProgress: certificateProgress,
        ready: progressReady,
    }: UserCertificationProgressProviderData = useUserCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification
    )

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useAllCertifications(routeParams.provider, course?.certificationId)

    const ready: boolean = useMemo(() => {
        return profileReady && courseReady && (!profile || (progressReady && certificateReady))
    }, [certificateReady, courseReady, profile, profileReady, progressReady])

    useCertificateScaling(ready ? certificateWrapRef : undefined)

    function handleBackBtnClick(): void {
        navigate(-1)
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
        if (ready && certificateProgress?.status !== UserCertificationProgressStatus.completed) {
            navigate(coursePath)
        }
    }, [
        certificateProgress,
        coursePath,
        navigate,
        ready,
    ])

    return (
        <>
            {!ready && <LoadingSpinner show />}

            {ready && (
                <div className={styles['wrap']}>
                    <div className={styles['content-wrap']}>
                        <div className={styles['btns-wrap']}>
                            <ActionButton
                                icon={<IconOutline.ChevronLeftIcon />}
                                onClick={handleBackBtnClick}
                            />
                        </div>
                        <div className={styles['certificate-wrap']} ref={certificateWrapRef}>
                            <Certificate
                                course={course?.title}
                                userName={userName}
                                tcHandle={profile?.handle}
                                provider={course?.provider}
                                completedDate={certificateProgress?.completedDate ?? ''}
                                elRef={certificateElRef}
                                type={certificate?.trackType}
                            />
                        </div>
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
                    </div>
                </div>
            )}
        </>
    )
}

export default MyCertificate
