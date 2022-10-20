import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Params, useParams, useSearchParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetAsync,
    UserProfile
} from '../../../../lib'
import CertificateView, { CertificateViewStyle } from '../certificate-view/CertificateView'

import styles from './UserCertificate.module.scss'

const UserCertificate: FC<{}> = () => {

    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()
    const routeParams: Params<string> = useParams()
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetAsync(routeParams.memberHandle)
                .then((userProfile) => {
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

        [].forEach.call(el.parentElement?.children ?? [], (c: HTMLElement) => {
            if (c !== el) {
                Object.assign(c.style, { display: 'none' })
            }
        })
        el.classList.add(styles['full-screen-cert'])
    })

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            {profileReady && profile && (
                <div ref={wrapElRef}>
                    <CertificateView
                        certification={certificationParam}
                        profile={profile}
                        provider={providerParam}
                        onCertificationNotCompleted={() => { }}
                        hideActions
                        viewStyle={queryParams.get('view-style') as CertificateViewStyle}
                    />
                </div>
            )}
        </>
    )
}

export default UserCertificate
