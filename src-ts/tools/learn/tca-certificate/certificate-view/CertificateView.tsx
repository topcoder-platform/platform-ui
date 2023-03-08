import { FC, MutableRefObject, ReactNode, useCallback, useRef } from 'react'

import {
    IconOutline,
    LoadingSpinner,
    UserProfile,
} from '../../../../lib'
import {
    ActionButton,
    CertificateNotFoundContent,
    CertificatePageLayout,
    PageTitle,
    TCACertificatePreview,
    TCACertification,
    TCACertificationValidationData,
    useValidateTCACertification,
} from '../../learn-lib'
import { getTCACertificationPath, getTCACertificationValidationUrl, getUserTCACertificateSsr } from '../../learn.routes'
import { CertificateNotFound } from '../certificate-not-found'

interface CertificateViewProps {
    certification: string,
    fullScreenCertLayout?: boolean,
    profile: UserProfile,
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {

    const tcaCertificationPath: string = getTCACertificationPath(props.certification)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const {
        certification,
        enrollment,
        error: hasValidationError,
        ready,
    }: TCACertificationValidationData
        = useValidateTCACertification(props.certification, props.profile.handle)

    const hasCompletedTheCertification: boolean = !!certification && !!enrollment && !hasValidationError
    const certificateNotFoundError: boolean = ready && !hasCompletedTheCertification

    function getCertTitle(user: string): string {
        return `${user} - ${certification?.title}`
    }

    const certUrl: string = getUserTCACertificateSsr(
        props.certification,
        props.profile.handle,
        getCertTitle(props.profile.handle),
    )

    const certificationTitle: string = getCertTitle(enrollment?.userName || props.profile.handle)

    const validateLink: string = getTCACertificationValidationUrl(enrollment?.completionUuid as string)

    const handleLinkClick: () => void = useCallback(() => {
        window.open(validateLink, 'blank')
    }, [validateLink])

    function renderCertificate(): ReactNode {
        if (certificateNotFoundError) {
            return <CertificateNotFound />
        }

        return (
            <TCACertificatePreview
                certification={certification as TCACertification}
                completionUuid={enrollment?.completionUuid ?? ''}
                userName={enrollment?.userName}
                tcHandle={props.profile.handle}
                completedDate={enrollment?.completedAt as string}
                certificateElRef={certificateElRef}
                validateLink={validateLink}
            />
        )
    }

    return (
        <>
            <PageTitle>
                {`${!!enrollment && `${enrollment.userName}'s `}${certification?.title} Certificate`}
            </PageTitle>

            <LoadingSpinner hide={ready} />

            <CertificatePageLayout
                certificateElRef={certificateElRef}
                fallbackBackUrl={tcaCertificationPath}
                fullScreenCertLayout={!certificateNotFoundError && props.fullScreenCertLayout}
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
                className={certificateNotFoundError ? 'cert-not-found-layout' : ''}
                afterContent={certificateNotFoundError && (
                    <CertificateNotFoundContent className='desktop-hide' />
                )}
            >
                {renderCertificate()}
            </CertificatePageLayout>
        </>
    )
}

export default CertificateView
