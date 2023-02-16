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
    TCACertification,
    TCACertificationValidationData,
    useCertificateCanvas,
    useCertificatePrint,
    useCertificateScaling,
    useGetUserTCACompletedCertificationsMOCK,
    UserCompletedTCACertificationsProviderData,
    useValidateTCACertification,
} from '../../learn-lib'
import { getTCACertificationPath, getTCACertificationValidationUrl, getUserTCACertificateSsr } from '../../learn.routes'

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

    const {
        certification,
        enrollment,
        ready: certReady,
    }: TCACertificationValidationData
        = useValidateTCACertification(props.certification, props.profile.handle)

    function getCertTitle(user: string): string {
        return `${user} - ${certification?.title} Certification`
    }

    const certUrl: string = getUserTCACertificateSsr(
        props.certification,
        props.profile.handle,
        getCertTitle(props.profile.handle),
    )

    const certificationTitle: string = getCertTitle(enrollment?.userName || props.profile.handle)

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

    const validateLink: string = getTCACertificationValidationUrl(enrollment?.completionUuid as string)

    const handleLinkClick: () => void = useCallback(() => {
        window.open(validateLink, 'blank')
    }, [validateLink])

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
                                certification={certification as TCACertification}
                                completionUuid={enrollment?.completionUuid}
                                userName={enrollment?.userName}
                                tcHandle={props.profile.handle}
                                completedDate={enrollment?.completedAt as string}
                                elRef={certificateElRef}
                                validateLink={validateLink}
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
                                <ActionButton
                                    icon={<IconOutline.LinkIcon />}
                                    onClick={handleLinkClick}
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
