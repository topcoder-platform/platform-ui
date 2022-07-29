import { Dispatch, FC, MutableRefObject, SetStateAction, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Params, useParams } from 'react-router-dom'

import {
    LoadingSpinner,
    profileGetAsync,
    UserProfile
} from '../../../../lib'
import CertificateView from '../certificate-view/CertificateView'
import styles from './UserCertificate.module.scss'

const UserCertificate: FC<{}> = () => {
    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef();
    const routeParams: Params<string> = useParams()
    const [profile, setProfile]: [
        UserProfile|undefined,
        Dispatch<SetStateAction<UserProfile|undefined>>
    ] = useState()
    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const providerParam: string = routeParams.provider ?? ''
    const certificationParam: string = routeParams.certification ?? ''

    useEffect(() => {
        if (routeParams.memberHandle) {
            profileGetAsync(routeParams.memberHandle).then((userProfile) => {
                setProfile(userProfile!);
                setProfileReady(true);
            })
        }
    }, [routeParams.memberHandle, setProfileReady]);

    useLayoutEffect(() => {
        if (!wrapElRef.current) {
            return
        }

        const el = wrapElRef.current;
        [].forEach.call(el.parentElement.children, (c: HTMLElement) => {
            if (c !== el) {
                Object.assign(c.style, {display: 'none'})
            }
        });
        el.classList.add(styles['full-screen-cert']);
    })

    return (
        <>
            {!profileReady && <LoadingSpinner show />}

            {profileReady && profile && (
                <div ref={wrapElRef}>
                    <CertificateView
                        certification={certificationParam}
                        profile={profile}
                        provider={providerParam}
                        onCertificationNotCompleted={() => {}}
                        hideActions
                    />
                </div>
            )}
        </>
    )
}

export default UserCertificate
