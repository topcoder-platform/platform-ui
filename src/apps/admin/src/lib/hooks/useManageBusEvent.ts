/**
 * Manage bus event
 */
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import { CREATE_BUS_EVENT_DATA_SUBMISSION_MARATHON_MATCH } from '../../config/busEvent.config'
import { reqToBusAPI } from '../services'
import { handleError } from '../utils'
import { IsRemovingType } from '../models'

export interface PostBusEventOptions {
    silent?: boolean
}

export type DoPostBusEvent = (
    submissionId: string,
    testType: string,
    options?: PostBusEventOptions,
) => Promise<void>

export interface useManageBusEventProps {
    isRunningTest: IsRemovingType
    isRunningTestBool: boolean
    doPostBusEvent: DoPostBusEvent
}

/**
 * Manage bus event
 */
export function useManageBusEvent(): useManageBusEventProps {
    const [isRunningTest, setIsRunningTest] = useState<IsRemovingType>({})
    const isRunningTestBool = useMemo(
        () => _.some(isRunningTest, value => value === true),
        [isRunningTest],
    )

    const doPostBusEvent = useCallback<DoPostBusEvent>(
        (submissionId, testType, options) => {
            setIsRunningTest(previous => ({
                ...previous,
                [`${submissionId}_${testType}`]: true,
            }))
            return reqToBusAPI(
                CREATE_BUS_EVENT_DATA_SUBMISSION_MARATHON_MATCH(
                    submissionId,
                    testType,
                ),
            )
                .then(() => {
                    if (options?.silent !== true) {
                        toast.success(`Run ${testType} test successfully`, {
                            toastId: 'Run test',
                        })
                    }
                })
                .catch(error => {
                    handleError(error)
                    throw error
                })
                .finally(() => {
                    setIsRunningTest(previous => ({
                        ...previous,
                        [`${submissionId}_${testType}`]: false,
                    }))
                })
        },
        [],
    )

    return {
        doPostBusEvent,
        isRunningTest,
        isRunningTestBool,
    }
}
