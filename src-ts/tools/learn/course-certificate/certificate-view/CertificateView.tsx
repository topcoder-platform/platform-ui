import {
    FC,
    MutableRefObject,
    ReactNode,
    useMemo,
    useRef,
} from 'react'

import {
    AllCertificationsProviderData,
    CertificateNotFoundContent,
    CertificatePageLayout,
    CoursesProviderData,
    PageTitle,
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
import { CertificateNotFound } from '../certificate-not-found'

import Certificate from './certificate/Certificate'

interface CertificateViewProps {
    certification: string
    fullScreenCertLayout?: boolean
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
    const certificateNotFoundError: boolean = ready && !hasCompletedTheCertification

    function renderCertificate(): ReactNode {
        if (ready && !hasCompletedTheCertification) {
            return <CertificateNotFound />
        }

        return (
            <Certificate
                completedDate={completedCertificate?.completedDate ?? ''}
                course={course?.title}
                elRef={certificateElRef}
                provider={course?.resourceProvider.name}
                tcHandle={props.profile.handle}
                type={certificate?.certificationCategory?.track}
                userName={userName}
            />
        )
    }

    return (
        <>
            <PageTitle>
                {`${props.profile.handle}'s ${course?.title} Certificate`}
            </PageTitle>

            <CertificatePageLayout
                certificateElRef={certificateElRef}
                fallbackBackUrl={coursePath}
                fullScreenCertLayout={!certificateNotFoundError && props.fullScreenCertLayout}
                isCertificateCompleted={hasCompletedTheCertification}
                isReady={ready}
                ssrUrl={certUrl}
                title={certificationTitle}
                disableActions={ready && !hasCompletedTheCertification}
                className={certificateNotFoundError ? 'cert-not-found-layout' : ''}
                afterContent={certificateNotFoundError && (
                    <CertificateNotFoundContent className='desktop-hide' />
                )}
            >
                {renderCertificate()}
            </CertificatePageLayout>
        </>
    )
}

export default CertificateView
