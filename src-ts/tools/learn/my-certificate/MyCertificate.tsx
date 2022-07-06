import html2canvas from 'html2canvas'
import { FC, MutableRefObject, useContext, useEffect, useRef } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    fileCreateFromCanvas,
    fileDownloadCanvasAsImage,
    IconOutline,
    LoadingSpinner,
    profileContext,
    ProfileContextData
} from '../../../lib'
import {
    CoursesProviderData,
    MyCertificationProgressProviderData,
    MyCertificationProgressStatus,
    useCoursesProvider,
    useMyCertificationProgress,
} from '../learn-lib'
import { getCoursePath } from '../learn.routes'

import { ActionButton } from './action-button'
import { Certificate } from './certificate'
import styles from './MyCertificate.module.scss'

const MyCertificate: FC<{}> = () => {

    const { profile }: ProfileContextData = useContext(profileContext)
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''
    const coursePath: string = getCoursePath(providerParam, certificationParam)
    const certificateElRef: MutableRefObject<HTMLElement|any> = useRef()
    const userName: string = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useCoursesProvider(providerParam, certificationParam)

    const certificationTitle: string = `${userName} - ${course?.title} Certification`

    const {
        certificateProgress,
        ready: progressReady,
    }: MyCertificationProgressProviderData = useMyCertificationProgress(
        profile?.userId,
        routeParams.provider,
        routeParams.certification
    )

    const ready: boolean = courseReady && progressReady

    function handleBackBtnClick(): void {
        navigate(-1)
    }

    async function getCertificateCanvas(): Promise<HTMLCanvasElement|void> {
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
        const canvas: HTMLCanvasElement|void = await getCertificateCanvas()
        if (!canvas) {
            return
        }
        fileDownloadCanvasAsImage(canvas, `${certificationTitle}.png`)
    }

    async function handlePrint(): Promise<void> {
        const canvas: HTMLCanvasElement|void = await getCertificateCanvas()
        if (!canvas) {
            return
        }
        const printWindow: Window|null = window.open('')

        if (!printWindow) {
            return
        }

        printWindow.document.body.appendChild(canvas)
        printWindow.document.title = certificationTitle
        printWindow.focus()
        printWindow.print()
    }

    async function handleShare(): Promise<void> {
        const canvas: HTMLCanvasElement|void = await getCertificateCanvas()
        if (!canvas) {
            return
        }
        const sharedImg: File = await fileCreateFromCanvas(canvas, `${certificationTitle}.png`)

        if (navigator.canShare?.({ files: [sharedImg] })) {
            try {
                await navigator.share({
                    files: [sharedImg],
                    title: certificationTitle,
                })
            } catch (error) {}
        }
    }

    useEffect(() => {
        if (ready && certificateProgress?.status !== MyCertificationProgressStatus.completed) {
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
            {!ready && <LoadingSpinner />}

            {ready && (
                <div className={styles['wrap']}>
                    <div className={styles['content-wrap']}>
                        <div className={styles['btns-wrap']}>
                            <ActionButton
                                icon={<IconOutline.ChevronLeftIcon />}
                                onClick={handleBackBtnClick}
                            />
                        </div>
                        <div className={styles['certificate-wrap']}>
                            <Certificate
                                course={course?.title}
                                userName={userName}
                                tcHandle={profile?.handle}
                                provider={course?.provider}
                                completedDate={certificateProgress?.completedDate ?? ''}
                                elRef={certificateElRef}
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
                            <ActionButton
                                icon={<IconOutline.ShareIcon />}
                                onClick={handleShare}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default MyCertificate
