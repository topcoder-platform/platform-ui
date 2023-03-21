import { FC } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    TCACertification,
    TCACertificationEnrollmentProviderData,
    useTCACertificationEnrollment,
} from '../../learn-lib'

import { useGetUserProfile, UseGetUserProfileData } from './use-get-user-profile'
import UserCertificationViewBase from './UserCertificationViewBase'

const UuidCertificationView: FC<{}> = () => {

    const routeParams: Params<string> = useParams()

    const {
        enrollment,
        error: enrollmentError,
    }: TCACertificationEnrollmentProviderData
        = useTCACertificationEnrollment(routeParams.completionUuid as string)

    const { profile }: UseGetUserProfileData = useGetUserProfile(enrollment?.userHandle)

    const certification: TCACertification | undefined = enrollment?.topcoderCertification

    return (
        <UserCertificationViewBase
            enrollment={enrollment}
            certification={certification}
            profile={profile}
            enrollmentError={enrollmentError}
        />
    )
}

export default UuidCertificationView
