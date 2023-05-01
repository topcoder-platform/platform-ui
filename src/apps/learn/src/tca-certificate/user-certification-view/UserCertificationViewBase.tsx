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
import { useSearchParams } from 'react-router-dom'

import { LoadingSpinner } from '~/libs/ui'
import {
    getVerificationStatusAsync,
    UserProfile,
} from '~/libs/core'

import {
    CertificatePageLayout,
    hideSiblings,
    HiringManagerView,
    PageTitle,
    TCACertification,
    TCACertificationEnrollmentBase,
} from '../../lib'
import { getTCACertificationPath, getTCACertificationValidationUrl } from '../../learn.routes'
import { CertificateNotFound } from '../certificate-not-found'

interface UserCertificationViewBaseProps {
    certification?: TCACertification
    enrollment?: TCACertificationEnrollmentBase
    enrollmentError?: boolean
    isPreview?: boolean
    profile?: UserProfile
}

const UserCertificationViewBase: FC<UserCertificationViewBaseProps> = (props: UserCertificationViewBaseProps) => {
    const [queryParams]: [URLSearchParams, any] = useSearchParams()
    const elRef: MutableRefObject<HTMLElement | any> = useRef()

    const tcaCertificationPath: string = getTCACertificationPath(`${props.certification?.dashedName}`)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const isOwnProfile: boolean = !!props.profile?.email

    const isModalView: boolean = queryParams.get('view-style') === 'modal'

    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const validationUrl: string = getTCACertificationValidationUrl(props.enrollment?.completionUuid as string)

    useEffect(() => {
        if (!props.enrollment?.userHandle) {
            return
        }

        getVerificationStatusAsync(props.enrollment?.userHandle)
            .then(verified => setIsMemberVerified(verified))
    }, [props.enrollment])

    useLayoutEffect(() => {
        const el: HTMLElement = elRef.current
        if (!el || !isModalView) {
            return
        }

        hideSiblings(el.parentElement as HTMLElement)
    }, [isModalView])

    return (
        <>
            <PageTitle>
                {`${!!props.enrollment && `${props.enrollment.userName}'s `}${props.certification?.title} Certificate`}
            </PageTitle>
            <LoadingSpinner hide={props.enrollmentError || (props.profile && !!props.enrollment)} ref={elRef} />

            {props.enrollmentError && (
                <CertificatePageLayout
                    certificateElRef={certificateElRef}
                    fallbackBackUrl={tcaCertificationPath}
                    isReady
                    className='cert-not-found-layout'
                    ssrUrl=''
                >
                    <CertificateNotFound />
                </CertificatePageLayout>
            )}

            <div className='full-height-frame' ref={elRef}>
                {props.profile && props.certification && props.enrollment && (
                    <HiringManagerView
                        certification={props.certification}
                        completedAt={(props.enrollment.completedAt ?? undefined) as string}
                        completionUuid={props.enrollment.completionUuid ?? undefined}
                        isMemberVerified={isMemberVerified}
                        userProfile={props.profile}
                        userName={props.enrollment.userName}
                        isOwner={isOwnProfile}
                        validationUrl={validationUrl}
                        isPreview={props.isPreview}
                        isModalView={isModalView}
                    />
                )}
            </div>
        </>
    )
}

export default UserCertificationViewBase
