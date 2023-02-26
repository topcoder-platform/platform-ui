import { FC, MutableRefObject, useCallback, useEffect, useMemo, useRef } from 'react'

import {
    IconOutline,
    LoadingSpinner,
    UserProfile,
} from '../../../../lib'
import {
    ActionButton,
    CertificatePageLayout,
    TCACertificatePreview,
    TCACertification,
    TCACertificationValidationData,
    useGetUserTCACompletedCertificationsMOCK,
    UserCompletedTCACertificationsProviderData,
    useValidateTCACertification,
} from '../../learn-lib'
import { getTCACertificationPath, getTCACertificationValidationUrl, getUserTCACertificateSsr } from '../../learn.routes'

interface CertificateViewProps {
    certification: string,
    fullScreenCertLayout?: boolean,
    onCertificationNotCompleted: () => void
    profile: UserProfile,
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {

    const tcaCertificationPath: string = getTCACertificationPath(props.certification)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const {
        certification,
        enrollment,
        ready: certReady,
    }: TCACertificationValidationData
        = useValidateTCACertification(props.certification, props.profile.handle)

    function getCertTitle(user: string): string {
        return `${user} - ${certification?.title}`
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

            <CertificatePageLayout
                certificateElRef={certificateElRef}
                fallbackBackUrl={tcaCertificationPath}
                fullScreenCertLayout={props.fullScreenCertLayout}
                isCertificateCompleted={hasCompletedTheCertification}
                isReady={ready}
                ssrUrl={certUrl}
                title={certificationTitle}
                actions={(
                    <ActionButton
                        icon={<IconOutline.LinkIcon />}
                        onClick={handleLinkClick}
                    />
                )}
            >
                <TCACertificatePreview
                    certification={certification as TCACertification}
                    completionUuid={enrollment?.completionUuid ?? ''}
                    userName={enrollment?.userName}
                    tcHandle={props.profile.handle}
                    completedDate={enrollment?.completedAt as string}
                    certificateElRef={certificateElRef}
                    validateLink={validateLink}
                />
            </CertificatePageLayout>
        </>
    )
}

export default CertificateView
