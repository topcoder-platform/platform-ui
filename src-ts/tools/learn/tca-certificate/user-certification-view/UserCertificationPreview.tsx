import { FC } from 'react'
import { Params, useParams } from 'react-router-dom'

import { LoadingSpinner, UserProfile } from '../../../../lib'
import {
    TCACertificationEnrollmentBase,
    TCACertificationProviderData,
    useGetTCACertification,
} from '../../learn-lib'

import UserCertificationViewBase from './UserCertificationViewBase'

const placeholderUserProfile: UserProfile = {
    firstName: 'Your',
    handle: 'your_handle',
    lastName: 'Name',
} as UserProfile

const placeholderEnrollment: TCACertificationEnrollmentBase = {
    completedAt: new Date()
        .toISOString(),
    completionUuid: 'certificate-number',
    userHandle: 'your_handle',
    userName: 'Your Name',
} as TCACertificationEnrollmentBase

const UserCertificationPreview: FC<{}> = () => {
    const routeParams: Params<string> = useParams()

    const {
        certification,
        ready,
    }: TCACertificationProviderData
        = useGetTCACertification(`${routeParams.certification}`)

    return (
        <>
            <LoadingSpinner hide={ready} />

            <UserCertificationViewBase
                enrollment={placeholderEnrollment}
                certification={certification}
                profile={placeholderUserProfile}
                isPreview
            />
        </>
    )
}

export default UserCertificationPreview
