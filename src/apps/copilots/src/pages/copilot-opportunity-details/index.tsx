/* eslint-disable react/jsx-no-bind */
/* eslint-disable complexity */
import {
    Dispatch,
    FC,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { mutate } from 'swr'
import { toast } from 'react-toastify'
import moment from 'moment'

import {
    ButtonProps,
    ContentLayout,
    IconOutline,
    IconSolid,
    LoadingSpinner,
    PageTitle,
    TabsNavbar,
} from '~/libs/ui'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'
import { textFormatDateLocaleShortString } from '~/libs/shared'

import { CopilotApplication } from '../../models/CopilotApplication'
import {
    cancelCopilotOpportunity,
    copilotBaseUrl,
    CopilotOpportunityResponse,
    useCopilotApplications,
    useCopilotOpportunity,
} from '../../services/copilot-opportunities'
import { FormattedMembers, useMembers } from '../../services/members'
import { copilotRoutesMap } from '../../copilots.routes'
import { ProjectType } from '../../constants'

import { ApplyOpportunityModal } from './apply-opportunity-modal'
import {
    CopilotDetailsTabViews,
    getCopilotDetailsTabsConfig,
    getHashFromTabId,
    getTabIdFromHash,
} from './tabs/config/copilot-details-tabs-config'
import { OpportunityDetails } from './tabs/opportunity-details'
import { CopilotApplications } from './tabs/copilot-applications'
import styles from './styles.module.scss'

const CopilotOpportunityDetails: FC<{}> = () => {
    const { opportunityId }: {opportunityId?: string} = useParams<{ opportunityId?: string }>()
    const navigate = useNavigate()
    const [showNotFound, setShowNotFound] = useState(false)
    const [showApplyOpportunityModal, setShowApplyOpportunityModal] = useState(false)
    const { profile, initialized }: ProfileContextData = useContext(profileContext)
    const isCopilot: boolean = useMemo(
        () => !!profile?.roles?.some(role => role === UserRole.copilot),
        [profile],
    )
    const isAdminOrPM: boolean = useMemo(
        () => !!profile?.roles?.some(role => role === UserRole.administrator || role === UserRole.projectManager),
        [profile],
    )
    const { data: copilotApplications }: { data?: CopilotApplication[] } = useCopilotApplications(opportunityId)
    const appliedCopilotApplications = useMemo(
        () => copilotApplications?.filter(item => item.userId === profile?.userId),
        [copilotApplications, profile],
    )
    const { data: members }: { data?: FormattedMembers[]} = useMembers(
        copilotApplications ? copilotApplications?.map(item => item.userId) : [],
    )

    if (!opportunityId) {
        navigate(copilotRoutesMap.CopilotOpportunityList)
    }

    const { data: opportunity, isValidating }: CopilotOpportunityResponse = useCopilotOpportunity(opportunityId)

    const { hash }: { hash: string } = useLocation()

    const activeTabHash: string = useMemo<string>(() => getTabIdFromHash(hash), [hash])

    const [activeTab, setActiveTab]: [string, Dispatch<SetStateAction<string>>] = useState<string>(activeTabHash)

    useEffect(() => {
        if (isAdminOrPM) {
            setActiveTab(activeTabHash)
        } else {
            setActiveTab('0')
        }
    }, [activeTabHash, isAdminOrPM])

    const handleTabChange = useCallback((tabId: string): void => {
        setActiveTab(tabId)
        window.location.hash = getHashFromTabId(tabId)
    }, [getHashFromTabId, setActiveTab])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!opportunity) {
                setShowNotFound(true)
            }
        }, 2000)

        return () => clearTimeout(timer) // Cleanup on unmount
    }, [opportunity])

    const onApplied: () => void = useCallback(() => {
        mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
        mutate(`${copilotBaseUrl}/copilot/opportunity/${opportunityId}`)
    }, [])

    const onCloseApplyModal: () => void = useCallback(() => {
        setShowApplyOpportunityModal(false)
    }, [setShowApplyOpportunityModal])

    if (!opportunity && showNotFound) {
        return (
            <ContentLayout title='Copilot Opportunity Details'>
                <PageTitle>Opportunity Not Found</PageTitle>
                <p>The requested opportunity does not exist.</p>
            </ContentLayout>
        )
    }

    async function cancelCopilotOpportunityHandler(): Promise<void> {
        if (opportunityId) {
            await cancelCopilotOpportunity(opportunityId)
            mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
            mutate(`${copilotBaseUrl}/copilot/opportunity/${opportunityId}`)
            toast.success('Canceled copilot opportunity successfully')
        }

    }

    const applyCopilotOpportunityButton: ButtonProps = {
        label: 'Apply as Copilot',
        onClick: () => setShowApplyOpportunityModal(true),
    }

    const cancelCopilotOpportunityButton: ButtonProps = {
        label: 'Cancel opportunity',
        onClick: cancelCopilotOpportunityHandler,
    }

    const application = copilotApplications && copilotApplications[0]

    const getOpportunityType = (type: string): ProjectType => {
        switch (type) {
            case 'ai':
                return ProjectType.ai
            case 'datascience':
                return ProjectType.datascience
            case 'dev':
                return ProjectType.developement
            case 'design':
                return ProjectType.design
            default:
                return ProjectType.qa
        }
    }

    return (
        <ContentLayout
            title='Copilot Opportunity'
            buttonConfig={
                isCopilot
                && appliedCopilotApplications
                && appliedCopilotApplications.length === 0
                && opportunity?.status === 'active'
                    ? applyCopilotOpportunityButton : undefined
            }
            secondaryButtonConfig={
                opportunity?.status === 'active'
                && isAdminOrPM ? cancelCopilotOpportunityButton : undefined
            }
            infoComponent={(isCopilot && !(appliedCopilotApplications
                && appliedCopilotApplications.length === 0
            ) && opportunity?.status === 'active' && !!application) && (
                <div className={styles.applied}>
                    <IconSolid.CheckCircleIcon className={styles.appliedIcon} />
                    <span
                        className={styles.appliedText}
                    >
                        {`Applied on ${textFormatDateLocaleShortString(new Date(application.createdAt))}`}
                    </span>
                </div>
            )}
        >
            <PageTitle>
                Copilot Opportunity
            </PageTitle>
            {isValidating && !showNotFound && (
                <LoadingSpinner />
            ) }
            <div className={styles.wrapper}>
                <h1 className={styles.header}>
                    {opportunity?.opportunityTitle ?? opportunity?.projectName}
                </h1>
                <div className={styles.infoRow}>
                    <div className={styles.infoColumn}>
                        <IconOutline.ClipboardCheckIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Status</span>
                            <span className={styles.infoValue}>{opportunity?.status}</span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.PlayIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Start Date</span>
                            <span className={styles.infoValue}>
                                {moment(opportunity?.startDate)
                                    .format('MMM D, YYYY')}

                            </span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.CalendarIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Duration</span>
                            <span className={styles.infoValue}>
                                {opportunity?.numWeeks}
                                {' '}
                                weeks
                            </span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.ClockIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Hours</span>
                            <span className={styles.infoValue}>
                                {opportunity?.numHoursPerWeek}
                                {' '}
                                hours/week
                            </span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.CogIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Type</span>
                            <span
                                className={styles.infoValue}
                            >
                                {opportunity?.type && getOpportunityType(opportunity?.type)}
                            </span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.GlobeAltIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Working Hours</span>
                            <span className={styles.infoValue}>{opportunity?.tzRestrictions}</span>
                        </div>
                    </div>
                    <div className={styles.infoColumn}>
                        <IconOutline.CashIcon className={styles.icon} />
                        <div className={styles.infoText}>
                            <span className={styles.infoHeading}>Payment</span>
                            <span className={styles.infoValue}>
                                {opportunity?.paymentType === 'standard'
                                    ? opportunity.paymentType : opportunity?.otherPaymentType}
                            </span>
                        </div>
                    </div>
                </div>
                {
                    initialized && (
                        <TabsNavbar
                            defaultActive={activeTab}
                            onChange={handleTabChange}
                            tabs={getCopilotDetailsTabsConfig(isAdminOrPM, copilotApplications?.length || 0)}
                        />
                    )
                }
                {activeTab === CopilotDetailsTabViews.details && <OpportunityDetails opportunity={opportunity} />}
                {activeTab === CopilotDetailsTabViews.applications && isAdminOrPM && opportunity && (
                    <CopilotApplications
                        copilotApplications={copilotApplications}
                        opportunity={opportunity}
                        members={members}
                    />
                )}

                {
                    showApplyOpportunityModal
                    && opportunity && (
                        <ApplyOpportunityModal
                            copilotOpportunityId={opportunity?.id}
                            onClose={onCloseApplyModal}
                            projectName={opportunity?.projectName}
                            onApplied={onApplied}
                        />
                    )
                }
            </div>

        </ContentLayout>
    )
}

export default CopilotOpportunityDetails
