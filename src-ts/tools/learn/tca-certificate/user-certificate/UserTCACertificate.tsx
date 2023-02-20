import { Dispatch, FC, MutableRefObject, SetStateAction, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavigateFunction, Params, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetPublicAsync,
    UserProfile,
} from '../../../../lib'
import { getTCACertificationPath, getViewStyleParamKey } from '../../learn.routes'
import { CertificateView, CertificateViewStyle } from '../certificate-view'

import styles from './UserTCACertificate.module.scss'

const UserTCACertificate: FC<{}> = () => {

    const navigate: NavigateFunction = useNavigate()
    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()
    const routeParams: Params<string> = useParams()
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const certificationParam: string = routeParams.certification ?? ''
    const tcaCertificationPath: string = getTCACertificationPath(certificationParam)

    function hideSiblings(el: HTMLElement): void {
        [].forEach.call(el.parentElement?.children ?? [], (c: HTMLElement) => {
            if (c !== el) {
                Object.assign(c.style, { display: 'none' })
            }
        })
    }

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
        const el: HTMLElement = wrapElRef.current
        if (!el) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)
        el.classList.add(styles['full-screen-cert'])
    })

    const navigateToCertification: () => void = useCallback(() => {
        navigate(tcaCertificationPath)
    }, [tcaCertificationPath, navigate])

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <div ref={wrapElRef}>
                    <CertificateView
                        certification={certificationParam}
                        profile={profile}
                        onCertificationNotCompleted={navigateToCertification}
                        hideActions
                        viewStyle={queryParams.get(getViewStyleParamKey()) as CertificateViewStyle}
                    />
                </div>
            )}
        </>
    )
}

export default UserTCACertificate
