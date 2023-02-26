import {
    FC,
    MutableRefObject,
    useEffect,
    useMemo,
    useRef,
} from 'react'

import {
    AllCertificationsProviderData,
    CertificatePageLayout,
    CoursesProviderData,
    useGetCertification,
    useGetCourses,
    useGetUserCompletedCertifications,
    UserCompletedCertificationsProviderData,
} from '../../learn-lib'
import {
    getCoursePath,
    getUserCertificateSsr,
} from '../../learn.routes'
import { UserProfile } from '../../../../lib'

import Certificate from './certificate/Certificate'

interface CertificateViewProps {
    certification: string
    fullScreenCertLayout?: boolean
    onCertificationNotCompleted: () => void
    profile: UserProfile
    provider: string
}

const CertificateView: FC<CertificateViewProps> = (props: CertificateViewProps) => {
    const coursePath: string = getCoursePath(props.provider, props.certification)
    const certificateElRef: MutableRefObject<HTMLDivElement | any> = useRef()

    const userName: string = useMemo(() => (
        [props.profile.firstName, props.profile.lastName].filter(Boolean)
            .join(' ')
        || props.profile.handle
    ), [props.profile.firstName, props.profile.handle, props.profile.lastName])

    const {
        course,
        ready: courseReady,
    }: CoursesProviderData = useGetCourses(props.provider, props.certification)

    const {
        certification: certificate,
        ready: certificateReady,
    }: AllCertificationsProviderData = useGetCertification(
        props.provider,
        course?.certificationId ?? '',
        { enabled: !!course?.certificationId },
    )

    function getCertTitle(user: string): string {
        return `${user} - ${course?.title} Certification`
    }

    const certUrl: string = getUserCertificateSsr(
        props.provider,
        certificate?.certification ?? '',
        props.profile.handle,
        getCertTitle(props.profile.handle),
    )

    const certificationTitle: string = getCertTitle(userName || props.profile.handle)

    const {
        certifications: [completedCertificate],
        ready: completedCertificateReady,
    }: UserCompletedCertificationsProviderData = useGetUserCompletedCertifications(
        props.profile.userId,
        props.provider,
        certificate?.certification,
    )
    const hasCompletedTheCertification: boolean = !!completedCertificate

    const ready: boolean = useMemo(() => (
        completedCertificateReady && courseReady && certificateReady
    ), [certificateReady, completedCertificateReady, courseReady])

    useEffect(() => {
        if (ready && !hasCompletedTheCertification) {
            props.onCertificationNotCompleted()
        }
    }, [coursePath, hasCompletedTheCertification, props, ready])

    return (
        <CertificatePageLayout
            certificateElRef={certificateElRef}
            fallbackBackUrl={coursePath}
            fullScreenCertLayout={props.fullScreenCertLayout}
            isCertificateCompleted={hasCompletedTheCertification}
            isReady={ready}
            ssrUrl={certUrl}
            title={certificationTitle}
        >
            <Certificate
                completedDate={completedCertificate?.completedDate ?? ''}
                course={course?.title}
                elRef={certificateElRef}
                provider={course?.resourceProvider.name}
                tcHandle={props.profile.handle}
                type={certificate?.certificationCategory.track}
                userName={userName}
            />
        </CertificatePageLayout>
    )
}

export default CertificateView
