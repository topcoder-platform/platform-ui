/**
 * Manage bus event
 */
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import {
    CREATE_BUS_EVENT_AV_RESCAN,
} from '../../config/busEvent.config'
import { createAvScanSubmissionPayload, reqToBusAPI } from '../services'
import { handleError } from '../utils'
import { IsRemovingType, Submission } from '../models'

export interface useManageAVScanProps {
    isLoading: IsRemovingType
    isLoadingBool: boolean
    doPostBusEvent: (submission: Submission) => void
}

/**
 * Manage bus event
 */
export function useManageAVScan(): useManageAVScanProps {
    const [isLoading, setIsLoading] = useState<IsRemovingType>({})
    const isLoadingBool = useMemo(
        () => _.some(isLoading, value => value === true),
        [isLoading],
    )

    const doPostBusEvent = useCallback((submission: Submission) => {
        setIsLoading(previous => ({
            ...previous,
            [submission.id]: true,
        }))

        function cbError(e: Error): void {
            setIsLoading(previous => ({
                ...previous,
                [submission.id]: false,
            }))
            handleError(e)
        }

        createAvScanSubmissionPayload(submission)
            .then(payload => {
                const data = CREATE_BUS_EVENT_AV_RESCAN(payload)
                reqToBusAPI(data)
                    .then(() => {
                        setIsLoading(previous => ({
                            ...previous,
                            [submission.id]: false,
                        }))
                        toast.success(
                            'Sending request to av rescan successfully',
                            {
                                toastId: 'Av scan',
                            },
                        )
                    })
                    .catch(cbError)
            })
            .catch(cbError)
    }, [])

    return {
        doPostBusEvent,
        isLoading,
        isLoadingBool,
    }
}
