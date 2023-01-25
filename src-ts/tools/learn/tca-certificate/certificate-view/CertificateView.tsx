import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import classNames from 'classnames'

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
    ActionButton,
    TCACertificationProviderData,
    useCertificateCanvas,
    useCertificatePrint,
    useCertificateScaling,
    useGetTCACertificationMOCK,
    useGetUserTCACompletedCertificationsMOCK,
    UserCompletedTCACertificationsProviderData,
} from '../../learn-lib'
import { getTCACertificationPath, getUserTCACertificateSsr } from '../../learn.routes'

import { Certificate } from './certificate'
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

    const getCertificateCanvas: () => Promise<HTMLCanvasElement | void> = useCertificateCanvas(certificateElRef)

    const handleDownload: () => Promise<void> = useCallback(async () => {

        const canvas: HTMLCanvasElement | void = await getCertificateCanvas()
        if (!!canvas) {
            fileDownloadCanvasAsImage(canvas, `${certificationTitle}.png`)
        }

    }, [certificationTitle, getCertificateCanvas])

    const handlePrint: () => Promise<void> = useCertificatePrint(certificateElRef, certificationTitle)

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
