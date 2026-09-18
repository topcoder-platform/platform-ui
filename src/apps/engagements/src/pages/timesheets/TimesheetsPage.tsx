import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { ContentLayout, LoadingSpinner } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetViewerRole } from '../../lib/models'
import { getTimesheet } from '../../lib/services'

import AdminTimesheetView from './AdminTimesheetView'
import ManagerTimesheetView from './ManagerTimesheetView'
import MemberTimesheetView from './MemberTimesheetView'
import TimesheetHeader from './TimesheetHeader'
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
    const {
        assignmentId,
        engagementId,
    }: {
        assignmentId?: string
        engagementId?: string
    } = useParams<{ assignmentId: string, engagementId: string }>()

    const [timesheet, setTimesheet] = useState<TimesheetView | undefined>()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()
    const [isDirty, setIsDirty] = useState<boolean>(false)

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

    if (isLoading) {
        return (
            <ContentLayout>
                <LoadingSpinner />
            </ContentLayout>
        )
    }

    if (error || !timesheet) {
        return (
            <ContentLayout title='Timesheet'>
                <p className={styles.error} role='alert'>{error ?? ACCESS_DENIED_MESSAGE}</p>
            </ContentLayout>
        )
    }

    return (
        <ContentLayout title='Timesheet'>
            <div className={styles.page}>
                <TimesheetHeader
                    assignment={timesheet.assignment}
                    engagementTitle={timesheet.engagementTitle}
                    managers={timesheet.managers}
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
                        onTimesheetChange={setTimesheet}
                        timesheet={timesheet}
                    />
                )}

                {timesheet.viewerRole === TimesheetViewerRole.ADMINISTRATOR && (
                    <AdminTimesheetView
                        onTimesheetChange={setTimesheet}
                        timesheet={timesheet}
                    />
                )}
            </div>
        </ContentLayout>
    )
}

export default TimesheetsPage
