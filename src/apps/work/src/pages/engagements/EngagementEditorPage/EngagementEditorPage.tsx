/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'

import {
    ErrorMessage,
    LoadingSpinner,
} from '../../../lib/components'
import {
    WorkAppContext,
} from '../../../lib/contexts'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'
import type {
    EngagementLeadPrefill,
} from '../../../lib/models/EngagementLead.model'
import {
    WorkAppContextModel,
} from '../../../lib/models'
import {
    fetchEngagementLeadPrefill,
} from '../../../lib/services/engagement-leads.service'
import {
    canCreateEngagement,
    extractErrorMessage,
} from '../../../lib/utils'

import {
    EngagementEditorForm,
} from './components'
import styles from './EngagementEditorPage.module.scss'

function getErrorMessage(error: Error | undefined): string {
    if (!error) {
        return 'Unable to load engagement details.'
    }

    return error.message || 'Unable to load engagement details.'
}

function getPageTitle(
    isEditMode: boolean,
    projectName: string | undefined,
    fromLead: boolean,
): string {
    if (isEditMode) {
        return 'Edit Engagement'
    }

    if (fromLead) {
        return projectName
            ? `Create Engagement from Lead (${projectName})`
            : 'Create Engagement from Lead'
    }

    if (projectName) {
        return `Create Engagement (${projectName})`
    }

    return 'Create Engagement'
}

export const EngagementEditorPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()
    const [searchParams] = useSearchParams()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId
    const leadId = searchParams.get('leadId') || undefined

    const isEditMode = !!engagementId

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel
    const canManage = canCreateEngagement(contextValue.userRoles)
    const canEditParentProject = canManage

    const engagementResult = useFetchEngagement(canManage ? engagementId : undefined)
    const projectResult = useFetchProject(canManage ? projectId || undefined : undefined)

    const [leadPrefill, setLeadPrefill] = useState<EngagementLeadPrefill | undefined>(undefined)
    const [leadPrefillLoading, setLeadPrefillLoading] = useState<boolean>(Boolean(leadId && !isEditMode))
    const [leadPrefillError, setLeadPrefillError] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (!leadId || isEditMode || !canManage) {
            setLeadPrefill(undefined)
            setLeadPrefillLoading(false)
            setLeadPrefillError(undefined)
            return
        }

        setLeadPrefillLoading(true)
        setLeadPrefillError(undefined)

        fetchEngagementLeadPrefill(leadId)
            .then(response => {
                setLeadPrefill(response)
            })
            .catch((err: unknown) => {
                setLeadPrefillError(
                    extractErrorMessage(err, 'Unable to load engagement lead prefill data.'),
                )
            })
            .finally(() => {
                setLeadPrefillLoading(false)
            })
    }, [canManage, isEditMode, leadId])

    const pageTitle = useMemo(
        () => getPageTitle(isEditMode, projectResult.project?.name, Boolean(leadId)),
        [isEditMode, leadId, projectResult.project?.name],
    )

    const isLoading = engagementResult.isLoading || leadPrefillLoading

    return (
        <PageWrapper
            backUrl={`/projects/${projectId}/engagements`}
            breadCrumb={[]}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {!canManage
                    ? <ErrorMessage message='You need Admin or Talent Manager role to view engagements.' />
                    : undefined}

                {canManage && isLoading
                    ? <LoadingSpinner />
                    : undefined}

                {canManage && leadPrefillError
                    ? <ErrorMessage message={leadPrefillError} />
                    : undefined}

                {canManage && !isLoading && engagementResult.isError
                    ? (
                        <ErrorMessage
                            message={getErrorMessage(engagementResult.error)}
                            onRetry={() => {
                                engagementResult.mutate()
                                    .catch(() => undefined)
                            }}
                        />
                    )
                    : undefined}

                {canManage && !isLoading && !engagementResult.isError && !leadPrefillError
                    ? (
                        <EngagementEditorForm
                            canEditParentProject={canEditParentProject}
                            engagement={engagementResult.engagement}
                            isEditMode={isEditMode}
                            leadId={leadId}
                            leadPrefill={leadPrefill}
                            projectId={projectId}
                            projectName={projectResult.project?.name}
                        />
                    )
                    : undefined}
            </div>
        </PageWrapper>
    )
}

export default EngagementEditorPage
