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
} from '../../learn-lib'
import { perks } from '../certification-details-modal/certif-details-content/data'
import { PerksSection } from '../perks-section'
import { PageLayout } from '../page-layout'
import { EnrolledModal } from '../enrolled-modal'
import { getTCACertificationPath } from '../../learn.routes'
import { EnvironmentConfig } from '../../../../config'
import { StripeProduct, useGetStripeProduct } from '../../learn-lib/data-providers/payments'

import { EnrollmentSidebar } from './enrollment-sidebar'

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
    const certificationDashedName: string = certification?.dashedName ?? ''

    // fetch Stripe product data
    const { product }: { product: StripeProduct | undefined }
        = useGetStripeProduct(certification?.stripeProductId as string)

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

    if (ready && profile && !userInfo.current) {
        userInfo.current = { ...profile }
    }

    // if user is enrolled already, redirect back to certification
    if (progressReady && !enrolledCheck.current) {
        enrolledCheck.current = true
        if (!!progress) {
            navigate(getTCACertificationPath(certificationDashedName))
        }
    }

    const startEnrollFlow: () => Promise<void>
        = useCallback(async (): Promise<void> => {
            if (!profile) {
                return
            }

            await enrollTCACertificationAsync(`${profile.userId}`, `${certification?.id}`)
                .then(d => {
                    setIsEnrolledModalOpen(true)
                    setCertificateProgress(d)
                })
        }, [certification?.id, profile, setCertificateProgress])

    const tcaMonetizationEnabled: boolean = EnvironmentConfig.REACT_APP_ENABLE_TCA_CERT_MONETIZATION || false

    function navToCertificationDetails(): void {
        navigate(getTCACertificationPath(certificationDashedName))
    }

    function closeEnrolledModal(): void {
        setIsEnrolledModalOpen(false)
        navToCertificationDetails()
    }

    function renderMainContent(): ReactNode {
        return ready ? (
            <>
                <PerksSection
                    theme='clear'
                    items={perks}
                    title={tcaMonetizationEnabled
                        ? ''
                        : 'Enroll now for Free!'}
                />

                <EnrolledModal
                    isOpen={isEnrolledModalOpen}
                    onClose={closeEnrolledModal}
                />
            </>
        ) : undefined
    }

    function renderSidebar(): ReactNode {
        return (
            <EnrollmentSidebar onEnroll={startEnrollFlow} product={product} />
        )
    }

    useLayoutEffect(() => {
        if (profileReady && !profile) {
            navigate(getTCACertificationPath(certificationDashedName))
        }
    }, [profileReady, profile, navigate, certificationDashedName])

    return (
        <PageLayout
            sidebarContents={renderSidebar()}
            mainContent={renderMainContent()}
            extraBreadCrumbs={enrollmentBreadcrumb}
            certification={certification}
            hideWaveHeroText={tcaMonetizationEnabled}
        />
    )
}

export default EnrollmentPage
