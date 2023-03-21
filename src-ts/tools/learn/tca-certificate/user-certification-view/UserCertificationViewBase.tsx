import {
    Dispatch,
    FC,
    MutableRefObject,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    getVerificationStatusAsync,
    LoadingSpinner,
    UserProfile,
} from '../../../../lib'
import {
    CertificatePageLayout,
    HiringManagerView,
    PageTitle,
    TCACertification,
    TCACertificationEnrollmentBase,
} from '../../learn-lib'
import { getTCACertificationPath, getTCACertificationValidationUrl } from '../../learn.routes'
import { CertificateNotFound } from '../certificate-not-found'


interface UserCertificationViewBaseProps {
    enrollment?: TCACertificationEnrollmentBase
    profile?: UserProfile
    certification?: TCACertification
    enrollmentError?: boolean
}

const UserCertificationViewBase: FC<UserCertificationViewBaseProps> = (props: UserCertificationViewBaseProps) => {

    // const routeParams: Params<string> = useParams()
    const tcaCertificationPath: string = getTCACertificationPath(`${props.certification?.dashedName}`)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()
    const isOwnProfile: boolean = !!props.profile?.email

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

    return (
        <>
            <PageTitle>
                {`${!!props.enrollment && `${props.enrollment.userName}'s `}${props.certification?.title} Certificate`}
            </PageTitle>
            <LoadingSpinner hide={props.profile && (props.enrollmentError || !!props.enrollment)} />

            {props.profile && props.enrollmentError && (
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

            {props.profile && props.certification && props.enrollment && (
                <div className='full-height-frame'>
                    <HiringManagerView
                        certification={props.certification}
                        completedAt={(props.enrollment.completedAt ?? undefined) as string}
                        completionUuid={props.enrollment.completionUuid ?? undefined}
                        isMemberVerified={isMemberVerified}
                        userProfile={props.profile}
                        userName={props.enrollment.userName}
                        isOwner={isOwnProfile}
                        validationUrl={validationUrl}
                    />
                </div>
            )}
        </>
    )
}

export default UserCertificationViewBase
