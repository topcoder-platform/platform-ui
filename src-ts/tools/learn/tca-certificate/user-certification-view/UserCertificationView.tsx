import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    getVerificationStatusAsync,
    LoadingSpinner,
} from '../../../../lib'
import {
    CertificatePageLayout,
    CompletedTCACertificationEnrollmentData,
    HiringManagerView,
    PageTitle,
    useGetCompletedTCACertificationEnrollment,
} from '../../learn-lib'
import { EnvironmentConfig } from '../../../../config'
import { getTCACertificationPath, getTCAUserCertificationUrl } from '../../learn.routes'
import { CertificateNotFound } from '../certificate-not-found'

import { useGetUserProfile, UseGetUserProfileData } from './use-get-user-profile'

const UserCertificationView: FC<{}> = () => {

    const routeParams: Params<string> = useParams()
    const tcaCertificationPath: string = getTCACertificationPath(`${routeParams.certification}`)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const {
        profile,
        ready: profileReady,
        isOwnProfile,
    }: UseGetUserProfileData = useGetUserProfile(routeParams.memberHandle)

    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const {
        enrollment,
        certification,
        error,
        ready: enrollmentReady,
    }: CompletedTCACertificationEnrollmentData
        = useGetCompletedTCACertificationEnrollment(
            `${routeParams.certification}`,
            `${routeParams.memberHandle}`,
        )

    const validationUrl: string = `${EnvironmentConfig.TOPCODER_URLS.TCA}${getTCAUserCertificationUrl(
        `${routeParams.certification}`,
        `${routeParams.memberHandle}`,
    )}`

    useEffect(() => {
        if (routeParams?.memberHandle) {
            getVerificationStatusAsync(routeParams?.memberHandle)
                .then(verified => setIsMemberVerified(verified))
        }
    }, [enrollment, routeParams?.memberHandle])

    return (
        <>
            <PageTitle>
                {`${!!enrollment && `${enrollment.userName}'s `}${certification?.title} Certificate`}
            </PageTitle>
            <LoadingSpinner hide={profileReady && (error || enrollmentReady)} />

            {profile && error && (
                <CertificatePageLayout
                    certificateElRef={certificateElRef}
                    fallbackBackUrl={tcaCertificationPath}
                    isReady
                    className='cert-not-found-layout'
                    ssrUrl=''
                >
                    <CertificateNotFound />
                </CertificatePageLayout>
            )}

            {profile && certification && enrollment && (
                <div className='full-height-frame'>
                    <HiringManagerView
                        certification={certification}
                        completedAt={(enrollment.completedAt ?? undefined) as string}
                        completionUuid={enrollment.completionUuid ?? undefined}
                        isMemberVerified={isMemberVerified}
                        userProfile={profile}
                        userName={enrollment.userName}
                        isOwner={isOwnProfile}
                        validationUrl={validationUrl}
                    />
                </div>
            )}
        </>
    )
}

export default UserCertificationView
