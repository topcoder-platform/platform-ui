import { Dispatch, FC, SetStateAction, useEffect, useState } from "react"
import { Params, useParams } from "react-router"
import { UserProfile, UserStats, getMemberStatsAsync, profileGetPublicAsync } from "~/libs/core"
import { LoadingSpinner } from "~/libs/ui"
import { ProfilePageLayout } from "./page-layout"

const MemberProfilePage: FC<{}> = () => {
    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [memberStats, setMemberStats]: [
        UserStats | undefined,
        Dispatch<SetStateAction<UserStats | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
                .catch(err => {
                    console.error('Error loading memebr profile', err)
                    // TODO: NOT FOUND PAGE redirect/dispaly
                })

            getMemberStatsAsync(routeParams.memberHandle)
                .then(userStats => {
                    setMemberStats(userStats)
                })
        }
    }, [routeParams.memberHandle])

    console.log('MemberProfilePage', profile, memberStats)

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <ProfilePageLayout
                    memberStats={memberStats}
                    profile={profile}
                />
            )}
        </>
    )
}

export default MemberProfilePage