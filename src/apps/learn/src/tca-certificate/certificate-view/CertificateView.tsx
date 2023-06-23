import { FC, MutableRefObject, ReactNode, useRef } from 'react'
import { Params, useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'

import {
    CertificateNotFoundContent,
    CertificatePageLayout,
    PageTitle,
    TCACertificatePreview,
    TCACertification,
    TCACertificationValidationData,
    useValidateTCACertification,
} from '../../lib'
import { getTCACertificationPath, getTCACertificationValidationUrl, getUserTCACertificateSsr } from '../../learn.routes'
import { CertificateNotFound } from '../certificate-not-found'
import { useGetUserProfile, UseGetUserProfileData } from '../user-certification-view/use-get-user-profile'

const CertificateView: FC<{}> = () => {

    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const routeParams: Params<string> = useParams()
    const {
        isOwnProfile,
        ready: profileReady,
    }: UseGetUserProfileData = useGetUserProfile(routeParams.memberHandle)

    const userHandle: string = `${routeParams.memberHandle}`
    const certificationParam: string = routeParams.certification ?? ''

    const tcaCertificationPath: string = getTCACertificationPath(certificationParam)

    const {
        certification,
        enrollment,
        error: hasValidationError,
        ready,
    }: TCACertificationValidationData
        = useValidateTCACertification(certificationParam, userHandle)

    const hasCompletedTheCertification: boolean = !!certification && !!enrollment && !hasValidationError
    const certificateNotFoundError: boolean = profileReady && ready && !hasCompletedTheCertification

    function getCertTitle(user: string): string {
        return `${user} - ${certification?.title}`
    }

    const certUrl: string = getUserTCACertificateSsr(
        certificationParam,
        userHandle,
        getCertTitle(userHandle),
    )

    const certificationTitle: string = getCertTitle(enrollment?.userName || userHandle)

    const validateLink: string = getTCACertificationValidationUrl(enrollment?.completionUuid as string)

    function renderCertificate(): ReactNode {
        if (certificateNotFoundError) {
            return <CertificateNotFound />
        }

        return (
            <TCACertificatePreview
                certification={certification as TCACertification}
                completionUuid={enrollment?.completionUuid ?? ''}
                userName={enrollment?.userName}
                tcHandle={userHandle}
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

            {profileReady && (
                <CertificatePageLayout
                    certificateElRef={certificateElRef}
                    fallbackBackUrl={tcaCertificationPath}
                    fullScreenCertLayout={!certificateNotFoundError && !isOwnProfile}
                    isCertificateCompleted={hasCompletedTheCertification}
                    isReady={ready}
                    ssrUrl={certUrl}
                    title={certificationTitle}
                    className={certificateNotFoundError ? 'cert-not-found-layout' : ''}
                    afterContent={certificateNotFoundError && (
                        <CertificateNotFoundContent className='desktop-hide' />
                    )}
                >
                    {renderCertificate()}
                </CertificatePageLayout>
            )}
        </>
    )
}

export default CertificateView
