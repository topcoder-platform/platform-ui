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
    rootRoute,
} from '../../../config/routes.config'
import {
    EngagementLead,
    EngagementLeadStatus,
    EngagementLeadType,
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
import {
    canCreateEngagementFromLead,
    formatLeadType,
    getEngagementLeadsTabPath,
    getLeadDisplayStatus,
    getLeadStatusTransitions,
} from '../../../lib/utils/engagement-leads.utils'
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

const STATUS_ACTION_LABELS: Partial<Record<EngagementLeadStatus, string>> = {
    [EngagementLeadStatus.UNDER_REVIEW]: 'Mark Under Review',
    [EngagementLeadStatus.FULFILLED]: 'Mark Fulfilled',
    [EngagementLeadStatus.REJECTED]: 'Reject',
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

    const leadsBackUrl = `${rootRoute}${getEngagementLeadsTabPath(lead?.leadType)}`
    // Each lead shows only what its intake form asks for. The Wipro Direct form has no role,
    // experience, or commercial fields, so those stay off its view.
    const isWiproConsumption = lead?.leadType !== EngagementLeadType.WIPRO_DIRECT
    // Consumption leads submitted before the form switched to a maximum cost still carry
    // an engagement model and bill rate, so those show only when present.
    const legacyBillRate = lead?.billRateCurrency && lead.billRateAmount
        ? `${lead.billRateCurrency} ${lead.billRateAmount}/hour`
        : undefined

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

    const statusTransitions = lead ? getLeadStatusTransitions(String(lead.status)) : []
    const canCreateEngagement = lead && canCreateEngagementFromLead(lead)

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
                                {getLeadDisplayStatus(String(lead.status))}
                            </span>

                            {statusTransitions.map(status => (
                                <Button
                                    key={status}
                                    secondary
                                    disabled={updatingStatus}
                                    onClick={() => handleStatusUpdate(status)}
                                >
                                    {STATUS_ACTION_LABELS[status]}
                                </Button>
                            ))}
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
                                <DetailField label='Lead Type' value={formatLeadType(lead.leadType)} />
                                <DetailField label='Submitted' value={formatDate(lead.createdAt)} />
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Role Requirements</h3>
                            <div className={styles.grid}>
                                {isWiproConsumption && (
                                    <>
                                        {lead.engagementModel && (
                                            <DetailField
                                                label='Engagement Model'
                                                value={formatLabel(String(lead.engagementModel))}
                                            />
                                        )}
                                        <DetailField label='Role Title' value={lead.roleTitle} />
                                    </>
                                )}
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
                                {isWiproConsumption && (
                                    <DetailField label='Min Years Experience' value={lead.minYearsExperience} />
                                )}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Engagement Details</h3>
                            <div className={styles.grid}>
                                <DetailField label='Resources Required' value={lead.resourcesRequired} />
                                <DetailField
                                    label='Preferred Start Date'
                                    value={lead.preferredStartDate ? formatDate(lead.preferredStartDate) : undefined}
                                />
                                <DetailField label='Duration' value={lead.engagementDuration} />
                                <DetailField label='Working Hours / Day' value={lead.workingHoursPerDay} />
                                <DetailField label='Time Zone' value={lead.timeZoneRequirement} />
                                <DetailField label='Location Restrictions' value={lead.workLocationRestrictions} />
                                <DetailField label='Remote Accepted' value={formatBoolean(lead.remoteWorkAccepted)} />
                            </div>
                        </section>

                        {isWiproConsumption && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Commercials</h3>
                                <div className={styles.grid}>
                                    <DetailField label='Maximum Cost' value={lead.maximumCost} />
                                    {legacyBillRate && (
                                        <DetailField label='Client Bill Rate' value={legacyBillRate} />
                                    )}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </PageWrapper>
    )
}

export default EngagementLeadDetailPage
