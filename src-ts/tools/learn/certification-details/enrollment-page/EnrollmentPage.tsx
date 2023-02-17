import {
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    BreadcrumbItemModel,
    profileContext,
    ProfileContextData,
    UserProfile,
} from '../../../../lib'
import {
    enrollTCACertificationAsync,
    TCACertificationProgressProviderData,
    TCACertificationProviderData,
    useGetTCACertification,
    useGetTCACertificationProgress,
    useTcaCertificationModal,
} from '../../learn-lib'
import { perks } from '../certification-details-modal/certif-details-content/data'
import { PerksSection } from '../perks-section'
import { PageLayout } from '../page-layout'
import { EnrolledModal } from '../enrolled-modal'
import { getTCACertificationPath } from '../../learn.routes'

import { EnrollmentSidebar } from './enrollment-sidebar'
import { EnrollmentFormValue } from './enrollment-form/enrollment-form.config'

const enrollmentBreadcrumb: Array<BreadcrumbItemModel> = [{ name: 'Enrollment', url: '' }]

const EnrollmentPage: FC<{}> = () => {
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const { certification: dashedName }: Params<string> = routeParams
    const { initialized: profileReady, profile }: ProfileContextData = useContext(profileContext)
    const userInfo: MutableRefObject<UserProfile | undefined> = useRef()
    const enrolledCheck: MutableRefObject<boolean> = useRef(false)

    const [isEnrolledModalOpen, setIsEnrolledModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const {
        certification,
        ready: certificationReady,
    }: TCACertificationProviderData = useGetTCACertification(dashedName as string)

    // Fetch Enrollment status & progress
    const {
        progress,
        ready: progressReady,
        setCertificateProgress,
    }: TCACertificationProgressProviderData = useGetTCACertificationProgress(
        profile?.userId as unknown as string,
        dashedName as string,
        { enabled: profileReady && !!profile },
    )

    const ready: boolean = profileReady && certificationReady && progressReady && !!profile

    const tcaCertificationCompletedModal: ReactNode = useTcaCertificationModal(
        progress ? certification.dashedName : undefined,
        navToCertificationDetails,
    )

    if (ready && profile && !userInfo.current) {
        userInfo.current = { ...profile }
    }

    // if is enrolled already, redirect back to certification
    if (progressReady && !enrolledCheck.current) {
        enrolledCheck.current = true
        if (!!progress) {
            navigate(getTCACertificationPath(certification.dashedName))
        }
    }

    const startEnrollFlow: (value?: EnrollmentFormValue) => Promise<void>
    = useCallback(async (value?: EnrollmentFormValue): Promise<void> => {
        if (!profile) {
            return
        }

        if (value?.email) {
            userInfo.current = { ...userInfo.current, email: value.email }
            return
        }

        await enrollTCACertificationAsync(`${profile.userId}`, `${certification.id}`)
            .then(d => {
                setIsEnrolledModalOpen(true)
                setCertificateProgress(d)
            })
    }, [certification?.id, profile, setCertificateProgress])

    function navToCertificationDetails(): void {
        navigate(getTCACertificationPath(certification.dashedName))
    }

    function closeEnrolledModal(): void {
        setIsEnrolledModalOpen(false)
        if (!tcaCertificationCompletedModal) {
            navToCertificationDetails()
        }
    }

    function renderMainContent(): ReactNode {
        return ready ? (
            <>
                <PerksSection
                    style='clear'
                    items={perks}
                    title='Enroll now with our introductory low pricing!'
                />

                <EnrolledModal
                    isOpen={isEnrolledModalOpen}
                    certification={certification}
                    onClose={closeEnrolledModal}
                />
                {!isEnrolledModalOpen && tcaCertificationCompletedModal}
            </>
        ) : null
    }

    function renderSidebar(): ReactNode {
        return (
            <EnrollmentSidebar profile={profile} onEnroll={startEnrollFlow} />
        )
    }

    useLayoutEffect(() => {
        if (profileReady && !profile) {
            navigate(getTCACertificationPath(certification.dashedName))
        }
    }, [profileReady, profile, navigate, certification?.dashedName])

    return (
        <PageLayout
            sidebarContents={renderSidebar()}
            mainContent={renderMainContent()}
            extraBreadCrumbs={enrollmentBreadcrumb}
            certification={certification}
        />
    )
}

export default EnrollmentPage
