/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useState,
} from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import { Button } from '~/libs/ui'

import {
    engagementLeadsRouteId,
    rootRoute,
} from '../../../config/routes.config'
import {
    EngagementLead,
    EngagementLeadStatus,
} from '../../../lib/models/EngagementLead.model'
import {
    fetchEngagementLeadById,
    updateEngagementLeadStatus,
} from '../../../lib/services/engagement-leads.service'
import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    extractErrorMessage,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'
import { fetchEngagement } from '../../../lib/services/engagements.service'
import { withQueryParams } from '../../../lib/utils/navigation.utils'

import styles from './EngagementLeadDetailPage.module.scss'

function formatLabel(value: string): string {
    return value
        .toLowerCase()
        .replace(/_/g, ' ')
}

function formatDate(value: string): string {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleString()
}

function formatBoolean(value: boolean): string {
    return value ? 'Yes' : 'No'
}

interface DetailFieldProps {
    label: string
    value?: string | number | null
    fullWidth?: boolean
}

const DetailField: FC<DetailFieldProps> = props => (
    <div className={`${styles.field} ${props.fullWidth ? styles.fullWidth : ''}`}>
        <span className={styles.fieldLabel}>{props.label}</span>
        <span className={styles.fieldValue}>{props.value ?? '—'}</span>
    </div>
)

export const EngagementLeadDetailPage: FC = () => {
    const params = useParams<{ leadId: string }>()
    const leadId = params.leadId || ''
    const navigate = useNavigate()

    const [lead, setLead] = useState<EngagementLead | undefined>(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>(undefined)
    const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
    const [projectId, setProjectId] = useState<string>('')
    const [viewingEngagement, setViewingEngagement] = useState<boolean>(false)

    const leadsBackUrl = `${rootRoute}/${engagementLeadsRouteId}`

    const loadLead = useCallback(async (): Promise<void> => {
        if (!leadId) {
            setError('Engagement lead not found.')
            setLoading(false)
            return
        }

        setLoading(true)
        setError(undefined)

        try {
            const response = await fetchEngagementLeadById(leadId)
            setLead(response)
        } catch (err: unknown) {
            setError(extractErrorMessage(err, 'Unable to load engagement lead.'))
        } finally {
            setLoading(false)
        }
    }, [leadId])

    useEffect(() => {
        loadLead()
            .catch(() => undefined)
    }, [loadLead])

    const handleStatusUpdate = useCallback(async (status: EngagementLeadStatus): Promise<void> => {
        if (!leadId || updatingStatus) {
            return
        }

        setUpdatingStatus(true)

        try {
            const updated = await updateEngagementLeadStatus(leadId, status)
            setLead(updated)
            showSuccessToast('Lead status updated.')
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to update lead status.'))
        } finally {
            setUpdatingStatus(false)
        }
    }, [leadId, updatingStatus])

    const handleCreateEngagement = useCallback(() => {
        const normalizedProjectId = projectId.trim()

        if (!normalizedProjectId) {
            showErrorToast('Please enter a project ID to create an engagement.')
            return
        }

        const createUrl = withQueryParams(
            `${rootRoute}/projects/${encodeURIComponent(normalizedProjectId)}/engagements/new`,
            { leadId },
        )

        navigate(createUrl)
    }, [leadId, navigate, projectId])

    const handleViewEngagement = useCallback(async (): Promise<void> => {
        if (!lead?.convertedEngagementId || viewingEngagement) {
            return
        }

        setViewingEngagement(true)

        try {
            const engagement = await fetchEngagement(lead.convertedEngagementId)
            const engagementProjectId = String(engagement.projectId || engagement.project?.id || '')
                .trim()

            if (!engagementProjectId) {
                showErrorToast('Unable to locate the project for this engagement.')
                return
            }

            navigate(
                `${rootRoute}/projects/${engagementProjectId}/engagements/${lead.convertedEngagementId}/view`,
            )
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to open engagement.'))
        } finally {
            setViewingEngagement(false)
        }
    }, [lead?.convertedEngagementId, navigate, viewingEngagement])

    const canUpdateStatus = lead
        && lead.status !== EngagementLeadStatus.CONVERTED
        && lead.status !== EngagementLeadStatus.REJECTED

    const canCreateEngagement = lead
        && (lead.status === EngagementLeadStatus.QUALIFIED
            || lead.status === EngagementLeadStatus.UNDER_REVIEW
            || lead.status === EngagementLeadStatus.SUBMITTED)

    return (
        <PageWrapper
            backUrl={leadsBackUrl}
            breadCrumb={[]}
            pageTitle={lead?.roleTitle || 'Engagement Lead'}
        >
            <div className={styles.container}>
                {loading && <LoadingSpinner />}

                {error && (
                    <ErrorMessage
                        message={error}
                        onRetry={() => {
                            loadLead()
                                .catch(() => undefined)
                        }}
                    />
                )}

                {!loading && !error && lead && (
                    <>
                        <div className={styles.actions}>
                            <span className={styles.statusPill}>
                                {formatLabel(String(lead.status))}
                            </span>

                            {canUpdateStatus && (
                                <>
                                    <Button
                                        secondary
                                        disabled={updatingStatus}
                                        onClick={() => handleStatusUpdate(EngagementLeadStatus.UNDER_REVIEW)}
                                    >
                                        Mark Under Review
                                    </Button>
                                    <Button
                                        secondary
                                        disabled={updatingStatus}
                                        onClick={() => handleStatusUpdate(EngagementLeadStatus.QUALIFIED)}
                                    >
                                        Mark Qualified
                                    </Button>
                                    <Button
                                        secondary
                                        disabled={updatingStatus}
                                        onClick={() => handleStatusUpdate(EngagementLeadStatus.REJECTED)}
                                    >
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>

                        {lead.convertedEngagementId && (
                            <Button
                                disabled={viewingEngagement}
                                primary
                                onClick={() => {
                                    handleViewEngagement()
                                        .catch(() => undefined)
                                }}
                            >
                                View Engagement
                            </Button>
                        )}

                        {canCreateEngagement && (
                            <div className={styles.createEngagementRow}>
                                <input
                                    className={styles.projectInput}
                                    placeholder='Enter project ID to create engagement'
                                    value={projectId}
                                    onChange={event => setProjectId(event.target.value)}
                                />
                                <Button primary onClick={handleCreateEngagement}>
                                    Create Engagement from Lead
                                </Button>
                            </div>
                        )}

                        {lead.convertedEngagementId && (
                            <DetailField
                                fullWidth
                                label='Converted Engagement ID'
                                value={lead.convertedEngagementId}
                            />
                        )}

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Contact & Account</h3>
                            <div className={styles.grid}>
                                <DetailField label='Work Email (SPOC)' value={lead.workEmail} />
                                <DetailField label='Account / Customer' value={lead.accountName} />
                                <DetailField label='SMU' value={lead.smu} />
                                <DetailField label='Submitted' value={formatDate(lead.createdAt)} />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Role Requirements</h3>
                            <div className={styles.grid}>
                                <DetailField
                                    label='Engagement Model'
                                    value={formatLabel(String(lead.engagementModel))}
                                />
                                <DetailField label='Role Title' value={lead.roleTitle} />
                                <DetailField
                                    fullWidth
                                    label='Job Description'
                                    value={lead.jobDescription}
                                />
                                <DetailField
                                    fullWidth
                                    label='Required Skills'
                                    value={lead.requiredSkills.join(', ')}
                                />
                                <DetailField
                                    label='Experience Level'
                                    value={formatLabel(String(lead.experienceLevel))}
                                />
                                <DetailField label='Min Years Experience' value={lead.minYearsExperience} />
                                <DetailField label='Industry Domain' value={lead.industryDomain} />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Engagement Details</h3>
                            <div className={styles.grid}>
                                <DetailField label='Resources Required' value={lead.resourcesRequired} />
                                <DetailField label='Preferred Start Date' value={formatDate(lead.preferredStartDate)} />
                                <DetailField label='Duration' value={lead.engagementDuration} />
                                <DetailField label='Working Hours / Day' value={lead.workingHoursPerDay} />
                                <DetailField label='Time Zone' value={lead.timeZoneRequirement} />
                                <DetailField label='Remote Accepted' value={formatBoolean(lead.remoteWorkAccepted)} />
                                <DetailField label='Location Restrictions' value={lead.workLocationRestrictions} />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Commercial & Priority</h3>
                            <div className={styles.grid}>
                                <DetailField
                                    label='Client Bill Rate'
                                    value={`${lead.billRateCurrency} ${lead.billRateAmount}/hour`}
                                />
                                <DetailField label='Priority' value={formatLabel(String(lead.priority))} />
                                <DetailField
                                    fullWidth
                                    label='Additional Requirements'
                                    value={lead.additionalRequirements}
                                />
                            </div>
                        </section>
                    </>
                )}
            </div>
        </PageWrapper>
    )
}

export default EngagementLeadDetailPage
