import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { Params, useParams } from "react-router"
import { UserProfile, profileGetPublicAsync } from "~/libs/core"
import { LoadingSpinner } from "~/libs/ui"
import { ProfilePageLayout } from "./page-layout"

const MemberProfilePage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [routeParams.memberHandle, setProfileReady])

    console.log('profile', profile)

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <ProfilePageLayout
                    profile={profile}
                />
            )}
        </>
    )
}

export default MemberProfilePage