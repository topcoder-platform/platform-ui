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

export interface useManageBusEventProps {
    isRunningTest: IsRemovingType
    isRunningTestBool: boolean
    doPostBusEvent: (submissionId: string, testType: string) => void
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

    const doPostBusEvent = useCallback(
        (submissionId: string, testType: string) => {
            setIsRunningTest(previous => ({
                ...previous,
                [`${submissionId}_${testType}`]: true,
            }))
            reqToBusAPI(
                CREATE_BUS_EVENT_DATA_SUBMISSION_MARATHON_MATCH(
                    submissionId,
                    testType,
                ),
            )
                .then(() => {
                    setIsRunningTest(previous => ({
                        ...previous,
                        [`${submissionId}_${testType}`]: false,
                    }))
                    toast.success(`Run ${testType} test successfully`, {
                        toastId: 'Run test',
                    })
                })
                .catch(e => {
                    setIsRunningTest(previous => ({
                        ...previous,
                        [`${submissionId}_${testType}`]: false,
                    }))
                    handleError(e)
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
