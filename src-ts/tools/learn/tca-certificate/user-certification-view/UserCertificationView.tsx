import { FC } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    CompletedTCACertificationEnrollmentData,
    useGetCompletedTCACertificationEnrollment,
} from '../../learn-lib'

import { useGetUserProfile, UseGetUserProfileData } from './use-get-user-profile'
import UserCertificationViewBase from './UserCertificationViewBase'

const UserCertificationView: FC<{}> = () => {

    const routeParams: Params<string> = useParams()

    const { profile }: UseGetUserProfileData = useGetUserProfile(routeParams.memberHandle)

    const {
        enrollment,
        certification,
        error: enrollmentError,
    }: CompletedTCACertificationEnrollmentData
        = useGetCompletedTCACertificationEnrollment(
            `${routeParams.certification}`,
            `${routeParams.memberHandle}`,
        )

    return (
        <UserCertificationViewBase
            enrollment={enrollment}
            certification={certification}
            profile={profile}
            enrollmentError={enrollmentError}
        />
    )
}

export default UserCertificationView
