/**
 * Manage submission reprocess event
 */
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import {
    CREATE_BUS_EVENT_REPROCESS_SUBMISSION,
} from '../../config/busEvent.config'
import { createSubmissionReprocessPayload, reqToBusAPI } from '../services'
import { handleError } from '../utils'
import { IsRemovingType, Submission } from '../models'

export interface useManageSubmissionReprocessProps {
    isLoading: IsRemovingType
    isLoadingBool: boolean
    doReprocessSubmission: (submission: Submission) => Promise<void>
}

/**
 * Manage submission reprocess
 */
export function useManageSubmissionReprocess(
    topic?: string,
): useManageSubmissionReprocessProps {
    const [isLoading, setIsLoading] = useState<IsRemovingType>({})
    const isLoadingBool = useMemo(
        () => _.some(isLoading, value => value === true),
        [isLoading],
    )

    const doReprocessSubmission = useCallback(
        async (submission: Submission) => {
            if (!topic) {
                toast.error(
                    'Submission reprocess is only available for specific challenge types.',
                    {
                        toastId: 'Reprocess submission',
                    },
                )
                return
            }

            setIsLoading(previous => ({
                ...previous,
                [submission.id]: true,
            }))

            try {
                const payload
                    = await createSubmissionReprocessPayload(submission)
                const data = CREATE_BUS_EVENT_REPROCESS_SUBMISSION(
                    topic,
                    payload,
                )
                await reqToBusAPI(data)
                toast.success('Reprocess submission request sent', {
                    toastId: 'Reprocess submission',
                })
            } catch (error) {
                handleError(error as Error)
            } finally {
                setIsLoading(previous => ({
                    ...previous,
                    [submission.id]: false,
                }))
            }
        },
        [topic],
    )

    return {
        doReprocessSubmission,
        isLoading,
        isLoadingBool,
    }
}
