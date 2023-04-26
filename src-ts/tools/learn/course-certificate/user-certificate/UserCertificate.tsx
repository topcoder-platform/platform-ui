import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetPublicAsync,
    UserProfile,
} from '../../../../lib'
import { CertificateView } from '../certificate-view'
import { hideSiblings } from '../../learn-lib'

const UserCertificate: FC<{}> = () => {
    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const routeParams: Params<string> = useParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetPublicAsync(routeParams.memberHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
        }
    }, [routeParams.memberHandle, setProfileReady])

    useLayoutEffect(() => {
        const el: HTMLElement = elRef.current
        if (!el) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)
    }, [])

    return (
        <>
            <LoadingSpinner hide={profileReady} ref={elRef} />

            {profileReady && profile && (
                <CertificateView
                    certification={certificationParam}
                    profile={profile}
                    provider={providerParam}
                    fullScreenCertLayout
                    ref={elRef}
                />
            )}
        </>
    )
}

export default UserCertificate
