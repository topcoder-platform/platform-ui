import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import classNames from 'classnames'

import {
    FacebookSocialShareBtn,
    fileDownloadCanvasAsImage,
    IconOutline,
    LinkedinSocialShareBtn,
    LoadingSpinner,
    NavigateBackFunction,
    TwitterSocialShareBtn,
    useNavigateBack,
    UserProfile,
} from '../../../../lib'
import {
    ActionButton,
    AllCertificationsProviderData,
    CoursesProviderData,
    useCertificateCanvas,
    useCertificatePrint,
    useCertificateScaling,
    useGetCertification,
    useGetCourses,
    useGetUserCompletedCertifications,
    UserCompletedCertificationsProviderData,
} from '../../learn-lib'
import { getCoursePath, getUserCertificateSsr } from '../../learn.routes'

import { Certificate } from './certificate'
import styles from './CertificateView.module.scss'

export type CertificateViewStyle = 'large-container'

interface CertificateViewProps {
    certification: string,
    hideActions?: boolean,
    onCertificationNotCompleted: () => void
    profile: UserProfile,
    provider: string,
    viewStyle?: CertificateViewStyle
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {

    const navigateBack: NavigateBackFunction = useNavigateBack()
    const coursePath: string = getCoursePath(props.provider, props.certification)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const certificateWrapRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const userName: string = useMemo(() => (
        [props.profile.firstName, props.profile.lastName].filter(Boolean)
            .join(' ')
        || props.profile.handle
    ), [props.profile.firstName, props.profile.handle, props.profile.lastName])

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useGetCourses(props.provider, props.certification)

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useGetCertification(
        props.provider,
        course?.certificationId ?? '',
        { enabled: !!course?.certificationId },
    )

    function getCertTitle(user: string): string {
        return `${user} - ${course?.title} Certification`
    }

    const certUrl: string = getUserCertificateSsr(
        props.provider,
        certificate?.certification ?? '',
        props.profile.handle,
        getCertTitle(props.profile.handle),
    )

    const certificationTitle: string = getCertTitle(userName || props.profile.handle)

    const {
        certifications: [completedCertificate],
        ready: completedCertificateReady,
    }: UserCompletedCertificationsProviderData = useGetUserCompletedCertifications(
        props.profile.userId,
        props.provider,
        certificate?.certification,
    )
    const hasCompletedTheCertification: boolean = !!completedCertificate

    const ready: boolean = useMemo(() => (
        completedCertificateReady && courseReady && certificateReady
    ), [certificateReady, completedCertificateReady, courseReady])

    const readyAndCompletedCertification: boolean = useMemo(() => (
        ready && hasCompletedTheCertification
    ), [hasCompletedTheCertification, ready])

    useCertificateScaling(ready ? certificateWrapRef : undefined, 880, 880)

    const handleBackBtnClick: () => void = useCallback(() => {
        navigateBack(coursePath)
    }, [coursePath, navigateBack])

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
    }, [coursePath, hasCompletedTheCertification, props, ready])

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
                            <div className={styles.certifInnerWrap}>
                                <Certificate
                                    course={course?.title}
                                    userName={userName}
                                    tcHandle={props.profile.handle}
                                    provider={course?.resourceProvider.name}
                                    completedDate={completedCertificate?.completedDate ?? ''}
                                    elRef={certificateElRef}
                                    type={certificate?.certificationCategory.track}
                                    viewStyle={props.viewStyle}
                                />
                            </div>
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
