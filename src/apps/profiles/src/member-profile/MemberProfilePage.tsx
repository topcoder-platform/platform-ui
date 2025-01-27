import { Dispatch, FC, SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import { Params, useNavigate, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'

import { profileContext, ProfileContextData, profileGetPublicAsync, UserProfile } from '~/libs/core'
import { TALENT_SEARCH_PATHS } from '~/apps/talent-search'
import { LoadingSpinner } from '~/libs/ui'

import { notifyUniNavi, triggerSurvey } from '../lib'

import { ProfilePageLayout } from './page-layout'
import { MemberProfileContextValue, useMemberProfileContext } from './MemberProfile.context'

const MemberProfilePage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()
    const navigate = useNavigate()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const { isTalentSearch }: MemberProfileContextValue = useMemberProfileContext()

    const { profile: authProfile }: ProfileContextData = useContext(profileContext)

    const handleBackBtn = useCallback(() => {
        navigate(-1)
    }, [navigate])

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile({ ...userProfile } as UserProfile)
                    setProfileReady(true)
                })
                .catch((e: AxiosError) => {
                    if (e.code === AxiosError.ERR_BAD_REQUEST && e.response?.status === 404) {
                        window.location.href = `${TALENT_SEARCH_PATHS.absoluteUrl}?memberNotFound`
                    }
                })
        }
    }, [routeParams.memberHandle])

    const refreshProfile = useCallback((handle: string) => (
        profileGetPublicAsync(handle)
            .then(userProfile => {
                setProfile({ ...userProfile } as UserProfile)
                if (userProfile) {
                    notifyUniNavi(userProfile)
                    triggerSurvey()
                }
            })
    ), [])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <ProfilePageLayout
                    handleBackBtn={handleBackBtn}
                    isTalentSearch={isTalentSearch}
                    profile={profile}
                    refreshProfile={refreshProfile}
                    authProfile={authProfile}
                />
            )}
        </>
    )
}

export default MemberProfilePage
