import { FC, useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

import { BaseModal, Button, ContentLayout, LoadingSpinner } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetViewerRole } from '../../lib/models'
import { getTimesheet } from '../../lib/services'
import { EngagementsTabs } from '../../components'
import { EngagementManagers } from '../../components/engagement-managers'
import { AuthCtx, useAuth } from '../../lib/utils/auth'
import {
    parseTimesheetReviewStatus,
    TIMESHEET_REVIEW_STATUS_PARAM,
} from '../../lib/utils'

import AdminTimesheetView from './AdminTimesheetView'
import ManagerTimesheetView from './ManagerTimesheetView'
import ManagersAuditModal from './ManagersAuditModal'
import MemberTimesheetView from './MemberTimesheetView'
import TimesheetHeader from './TimesheetHeader'
import TmTimesheetView from './TmTimesheetView'
import styles from './TimesheetsPage.module.scss'

const ACCESS_DENIED_MESSAGE = 'This timesheet is not available to you.'
const UNSAVED_CHANGES_MESSAGE = 'You have unsaved timesheet entries.'

const isNotFound = (error: unknown): boolean => {
    const typedError = error as { response?: { status?: number }, status?: number }
    const status = typedError?.response?.status ?? typedError?.status

    return status === 403 || status === 404
}

/**
 * The timesheet page, for every role.
 *
 * One route serves member, manager, and administrator, and which view renders is decided by the
 * `viewerRole` the API returns - never by inspecting the caller's roles here. That is what makes
 * "the page and its actions depend on the caller's role" have a single implementation, and it means a
 * member who hand-edits the URL to someone else's assignment gets an access-denied state driven by the
 * API's own 404 rather than hitting a guard they could bypass.
 */
const TimesheetsPage: FC = () => {
    const authCtx: AuthCtx = useAuth()
    const {
        assignmentId,
        engagementId,
    }: {
        assignmentId?: string
        engagementId?: string
    } = useParams<{ assignmentId: string, engagementId: string }>()
    const [searchParams] = useSearchParams()
    // The status the landing list was filtered by, so the review views open on the same thing.
    const initialStatus = parseTimesheetReviewStatus(searchParams.get(TIMESHEET_REVIEW_STATUS_PARAM))

    const [timesheet, setTimesheet] = useState<TimesheetView | undefined>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()
    const [isDirty, setIsDirty] = useState<boolean>(false)
    const [isManagersModalOpen, setIsManagersModalOpen] = useState<boolean>(false)
    const [isManagersAuditOpen, setIsManagersAuditOpen] = useState<boolean>(false)

    const reloadTimesheet = useCallback(async (): Promise<void> => {
        if (!assignmentId || !engagementId) {
            setError(ACCESS_DENIED_MESSAGE)
            return
        }

        const loaded = await getTimesheet(engagementId, assignmentId)
        setTimesheet(loaded)
        setError(undefined)
    }, [assignmentId, engagementId])

    useEffect(() => {
        let mounted = true

        if (!assignmentId || !engagementId) {
            setIsLoading(false)
            setError(ACCESS_DENIED_MESSAGE)
            return () => undefined
        }

        const load = async (): Promise<void> => {
            setIsLoading(true)

            try {
                const loaded = await getTimesheet(engagementId, assignmentId)

                if (mounted) {
                    setTimesheet(loaded)
                    setError(undefined)
                }
            } catch (loadError) {
                if (mounted) {
                    setError(isNotFound(loadError)
                        ? ACCESS_DENIED_MESSAGE
                        : 'Failed to load the timesheet. Please try again.')
                }
            } finally {
                if (mounted) {
                    setIsLoading(false)
                }
            }
        }

        load()

        return () => {
            mounted = false
        }
    }, [assignmentId, engagementId])

    useEffect(() => {
        if (timesheet?.viewerRole !== TimesheetViewerRole.ADMINISTRATOR) {
            setIsManagersModalOpen(false)
        }
    }, [timesheet?.viewerRole])

    // Unsaved rows live only in the browser, so leaving the page loses them. Warn before that happens.
    useEffect(() => {
        if (!isDirty) {
            return undefined
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent): string => {
            event.preventDefault()
            event.returnValue = UNSAVED_CHANGES_MESSAGE
            return UNSAVED_CHANGES_MESSAGE
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty])

    const canEditManagers = timesheet
        && ([TimesheetViewerRole.ADMINISTRATOR, TimesheetViewerRole.TM]
            .includes(timesheet.viewerRole) || authCtx.isTm)
    const canRenderContent = !isLoading && !error && timesheet

    return (
        <ContentLayout title='Timesheets' contentClass={styles.pageContent}>
            {isLoading && (
                <LoadingSpinner />
            )}

            <EngagementsTabs
                activeTab={
                    timesheet?.viewerRole === TimesheetViewerRole.MEMBER ? 'assignments' : 'timesheets'
                }
            />

            {(!!error || !timesheet) && (
                <p className={styles.error} role='alert'>{error ?? ACCESS_DENIED_MESSAGE}</p>
            )}

            {canRenderContent && (
                <div className={styles.page}>
                    <TimesheetHeader
                        assignment={timesheet.assignment}
                        engagementTitle={timesheet.engagementTitle}
                        managers={timesheet.managers}
                        onEditManagers={canEditManagers
                            ? function onEditManagers() {
                                setIsManagersModalOpen(true)
                            }
                            : undefined}
                        onViewManagersAudit={function onViewManagersAudit() {
                            setIsManagersAuditOpen(true)
                        }}
                    />

                    {timesheet.viewerRole === TimesheetViewerRole.MEMBER && (
                        <MemberTimesheetView
                            onDirtyChange={setIsDirty}
                            onTimesheetChange={setTimesheet}
                            timesheet={timesheet}
                        />
                    )}

                    {timesheet.viewerRole === TimesheetViewerRole.MANAGER && (
                        <ManagerTimesheetView
                            initialStatus={initialStatus}
                            onTimesheetChange={setTimesheet}
                            timesheet={timesheet}
                        />
                    )}

                    {timesheet.viewerRole === TimesheetViewerRole.TM && (
                        <TmTimesheetView
                            initialStatus={initialStatus}
                            onTimesheetChange={setTimesheet}
                            timesheet={timesheet}
                        />
                    )}

                    {timesheet.viewerRole === TimesheetViewerRole.ADMINISTRATOR && (
                        <AdminTimesheetView
                            initialStatus={initialStatus}
                            onTimesheetChange={setTimesheet}
                            timesheet={timesheet}
                        />
                    )}

                    <BaseModal
                        buttons={(
                            <Button
                                label='Close'
                                onClick={function onCloseManagersModal() {
                                    setIsManagersModalOpen(false)
                                }}
                                secondary
                            />
                        )}
                        onClose={function onCloseManagersModal() {
                            setIsManagersModalOpen(false)
                        }}
                        open={isManagersModalOpen}
                        size='lg'
                        title='Engagement managers'
                    >
                        <EngagementManagers
                            canEdit
                            engagementId={timesheet.engagementId}
                            managers={timesheet.managers}
                            onChange={function onManagersChange() {
                                reloadTimesheet()
                                    .catch(() => undefined)
                            }}
                        />
                    </BaseModal>

                    <ManagersAuditModal
                        engagementId={timesheet.engagementId}
                        onClose={function onCloseManagersAuditModal() {
                            setIsManagersAuditOpen(false)
                        }}
                        open={isManagersAuditOpen}
                    />
                </div>
            )}
        </ContentLayout>
    )
}

export default TimesheetsPage
