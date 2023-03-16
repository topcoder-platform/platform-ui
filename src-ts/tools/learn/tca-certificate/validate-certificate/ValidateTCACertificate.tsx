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
import { Params, useParams, useSearchParams } from 'react-router-dom'

import {
    getVerificationStatusAsync,
    LoadingSpinner,
    profileGetPublicAsync,
    UserProfile,
} from '../../../../lib'
import {
    HiringManagerView,
    PageTitle,
    TCACertification,
    TCACertificationEnrollmentProviderData,
    useTCACertificationEnrollment,
} from '../../learn-lib'
import { getTCACertificationValidationUrl } from '../../learn.routes'
import { hideSiblings } from '../../learn-lib/functions'

const ValidateTCACertificate: FC<{}> = () => {

    const wrapElRef: MutableRefObject<HTMLElement | any> = useRef()

    const routeParams: Params<string> = useParams()
    const [queryParams]: [URLSearchParams, any] = useSearchParams()

    const isModalView: boolean = queryParams.get('view-style') === 'modal'

    const [profile, setProfile]: [
        UserProfile | undefined,
        Dispatch<SetStateAction<UserProfile | undefined>>
    ] = useState()

    const [profileReady, setProfileReady]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const [isMemberVerified, setIsMemberVerified]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const {
        enrollment,
        ready: certReady,
    }: TCACertificationEnrollmentProviderData
        = useTCACertificationEnrollment(routeParams.completionUuid as string)

    const certification: TCACertification | undefined = enrollment?.topcoderCertification

    // TODO: update this to use `completionUuid`
    const validationUrl: string
        = getTCACertificationValidationUrl(routeParams.completionUuid as string)

    useEffect(() => {
        if (enrollment?.userHandle) {
            // get profile data for enrolled member
            profileGetPublicAsync(enrollment.userHandle)
                .then(userProfile => {
                    setProfile(userProfile)
                    setProfileReady(true)
                })
            // check member's verification status
            getVerificationStatusAsync(enrollment.userHandle)
                .then(verified => setIsMemberVerified(verified))
        }
    }, [enrollment, setProfileReady])

    useLayoutEffect(() => {
        const el: HTMLElement = wrapElRef.current
        if (!el || !isModalView) {
            return
        }

        hideSiblings(el)
        hideSiblings(el.parentElement as HTMLElement)

    })

    return (
        <>
            <PageTitle>
                {`${!!enrollment && `${enrollment.userName}'s `}${certification?.title} Certificate`}
            </PageTitle>
            <LoadingSpinner hide={profileReady && certReady} />

            {profile && certification && (
                <div className='full-height-frame' ref={wrapElRef}>
                    <HiringManagerView
                        certification={certification}
                        completedAt={(enrollment.completedAt ?? undefined) as string}
                        completionUuid={enrollment.completionUuid ?? undefined}
                        isModalView={isModalView}
                        isMemberVerified={isMemberVerified}
                        userProfile={profile}
                        userName={enrollment.userName}
                        validationUrl={validationUrl}
                    />
                </div>
            )}
        </>
    )
}

export default ValidateTCACertificate
