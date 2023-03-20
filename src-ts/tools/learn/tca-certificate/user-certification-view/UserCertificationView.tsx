import {
    Dispatch,
    FC,
    SetStateAction,
    useEffect,
    useState,
} from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    getVerificationStatusAsync,
    LoadingSpinner,
} from '../../../../lib'
import {
    CompletedTCACertificationEnrollmentData,
    HiringManagerView,
    PageTitle,
    useGetCompletedTCACertificationEnrollment,
} from '../../learn-lib'

import { useGetUserProfile, UseGetUserProfileData } from './use-get-user-profile'

const UserCertificationView: FC<{}> = () => {

    const routeParams: Params<string> = useParams()

    const {
        profile,
        ready: profileReady,
        isOwnProfile,
    }: UseGetUserProfileData = useGetUserProfile(routeParams.memberHandle);

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
                <div className='full-height-frame'>
                    404 not found
                </div>
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
                    />
                </div>
            )}
        </>
    )
}

export default UserCertificationView
