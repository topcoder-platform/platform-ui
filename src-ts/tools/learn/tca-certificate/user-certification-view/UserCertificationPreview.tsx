import { FC, useContext, useLayoutEffect } from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import { LoadingSpinner, profileContext, ProfileContextData, UserProfile } from '../../../../lib'
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
    completedAt: new Date().toISOString(),
    completionUuid: 'test-uuid',
    userHandle: 'your_handle',
    userName: 'Your Name',
} as TCACertificationEnrollmentBase

const UserCertificationPreview: FC<{}> = () => {
    const { profile, initialized: profileReady }: ProfileContextData = useContext(profileContext)
    const navigate: NavigateFunction = useNavigate()

    const routeParams: Params<string> = useParams()

    const {
        certification,
    }: TCACertificationProviderData
        = useGetTCACertification(`${routeParams.certification}`)

    useLayoutEffect(() => {
        if (profileReady && !profile) {
            navigate('..')
        }
    }, [navigate, profile, profileReady])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

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
