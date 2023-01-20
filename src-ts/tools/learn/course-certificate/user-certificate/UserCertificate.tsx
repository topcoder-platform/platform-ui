import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Params, useParams, useSearchParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetPublicAsync,
    UserProfile,
} from '../../../../lib'
import { getViewStyleParamKey } from '../../learn.routes'
import { CertificateView, CertificateViewStyle } from '../certificate-view'

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

    return (
        <>
            <LoadingSpinner hide={profileReady} />

            <div ref={wrapElRef}>
                {profileReady && profile && (
                    <CertificateView
                        certification={certificationParam}
                        profile={profile}
                        provider={providerParam}
                        onCertificationNotCompleted={() => { }}
                        hideActions
                        viewStyle={queryParams.get(getViewStyleParamKey()) as CertificateViewStyle}
                    />
                )}
            </div>
        </>
    )
}

export default UserCertificate
