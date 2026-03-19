/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useContext,
} from 'react'
import { useParams } from 'react-router-dom'

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
import {
    WorkAppContextModel,
} from '../../../lib/models'

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
): string {
    if (isEditMode) {
        return 'Edit Engagement'
    }

    if (projectName) {
        return `Create Engagement (${projectName})`
    }

    return 'Create Engagement'
}

export const EngagementEditorPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId

    const isEditMode = !!engagementId

    const workAppContext = useContext(WorkAppContext)
    const contextValue = workAppContext as WorkAppContextModel
    const canManage = contextValue.isAdmin || contextValue.isManager

    const engagementResult = useFetchEngagement(engagementId)
    const projectResult = useFetchProject(projectId || undefined)

    const pageTitle = getPageTitle(isEditMode, projectResult.project?.name)

    return (
        <PageWrapper
            backUrl={`/projects/${projectId}/engagements`}
            breadCrumb={[]}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {!canManage
                    ? <ErrorMessage message='You do not have permission to manage engagements.' />
                    : undefined}

                {canManage && engagementResult.isLoading
                    ? <LoadingSpinner />
                    : undefined}

                {canManage && !engagementResult.isLoading && engagementResult.isError
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

                {canManage && !engagementResult.isLoading && !engagementResult.isError
                    ? (
                        <EngagementEditorForm
                            engagement={engagementResult.engagement}
                            isEditMode={isEditMode}
                            projectId={projectId}
                        />
                    )
                    : undefined}
            </div>
        </PageWrapper>
    )
}

export default EngagementEditorPage
