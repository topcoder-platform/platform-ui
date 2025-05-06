import { FC, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import moment from 'moment'
import { mutate } from 'swr'

import {
    ButtonProps,
    ContentLayout,
    IconOutline,
    LoadingSpinner,
    PageTitle,
} from '~/libs/ui'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'

import { copilotBaseUrl, CopilotOpportunityResponse, useCopilotApplications, useCopilotOpportunity } from '../../services/copilot-opportunities'
import { copilotRoutesMap } from '../../copilots.routes'

import styles from './styles.module.scss'
import { ApplyOpportunityModal } from './apply-opportunity-modal'

const CopilotOpportunityDetails: FC<{}> = () => {
    const { opportunityId }: {opportunityId?: string} = useParams<{ opportunityId?: string }>()
    const navigate = useNavigate()
    const [showNotFound, setShowNotFound] = useState(false)
    const [showApplyOpportunityModal, setShowApplyOpportunityModal] = useState(false)
    const { profile }: ProfileContextData = useContext(profileContext)
    const isCopilot: boolean = useMemo(
        () => !!profile?.roles?.some(role => role === UserRole.copilot),
        [profile],
    )
    const { data: copilotApplications } = useCopilotApplications(opportunityId)

    if (!opportunityId) {
        navigate(copilotRoutesMap.CopilotOpportunityList)
    }

    const { data: opportunity, isValidating }: CopilotOpportunityResponse = useCopilotOpportunity(opportunityId)

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!opportunity) {
                setShowNotFound(true)
            }
        }, 2000)

        return () => clearTimeout(timer) // Cleanup on unmount
    }, [opportunity])

    if (!opportunity && showNotFound) {
        return (
            <ContentLayout title='Copilot Opportunity Details'>
                <PageTitle>Opportunity Not Found</PageTitle>
                <p>The requested opportunity does not exist.</p>
            </ContentLayout>
        )
    }

    const applyCopilotOpportunityButton: ButtonProps = {
        label: 'Apply as Copilot',
        onClick: () => setShowApplyOpportunityModal(true),
    }

    const onApplied = () => {
        mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
    }

    return (
        <ContentLayout title='Copilot Opportunity' buttonConfig={isCopilot && copilotApplications && copilotApplications.length === 0 ? applyCopilotOpportunityButton : undefined}>
            <PageTitle>Copilot Opportunity</PageTitle>
            {isValidating && !showNotFound && (
                <LoadingSpinner />
            ) }
            <h1 className={styles.header}>
                {opportunity?.projectName}
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
                        <span className={styles.infoValue}>{opportunity?.type}</span>
                    </div>
                </div>
                <div className={styles.infoColumn}>
                    <IconOutline.GlobeAltIcon className={styles.icon} />
                    <div className={styles.infoText}>
                        <span className={styles.infoHeading}>Working Hours</span>
                        <span className={styles.infoValue}>{opportunity?.tzRestrictions}</span>
                    </div>
                </div>
            </div>
            <div className={styles.content}>
                <div>
                    <h2 className={styles.subHeading}> Required skills </h2>
                    <div className={styles.skillsContainer}>
                        {opportunity?.skills.map((skill: any) => (
                            <div key={skill.id} className={styles.skillPill}>
                                {skill.name}
                            </div>
                        ))}
                    </div>
                    <h2 className={styles.subHeading}> Description </h2>
                    <p>
                        {opportunity?.overview}
                    </p>
                </div>
                <div>
                    <h2 className={styles.subHeading}> Complexity </h2>
                    <span className={styles.textCaps}>{opportunity?.complexity}</span>

                    <h2 className={styles.subHeading}> Requires Communication </h2>
                    <span className={styles.textCaps}>{opportunity?.requiresCommunication}</span>
                </div>
            </div>
            {
                showApplyOpportunityModal && opportunity && <ApplyOpportunityModal copilotOpportunityId={opportunity?.id} onClose={() => setShowApplyOpportunityModal(false)} projectName={opportunity?.projectName} onApplied={onApplied} />
            }
        </ContentLayout>
    )
}

export default CopilotOpportunityDetails
