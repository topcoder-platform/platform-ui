import {
    Dispatch,
    FC,
    SetStateAction,
    useState,
} from 'react'
import classNames from 'classnames'

import { ChevronDownIcon } from '@heroicons/react/solid'
import { Button } from '~/libs/ui'

import { DropdownMenu } from '../../lib/components/common/DropdownMenu'
import { useEventCallback } from '../../lib/hooks'
import { IsRemovingType } from '../../lib/models'

interface Props {
    submissionId: string
    reviewSummationId?: string
    testType: 'provisional' | 'system'
    isRunningTest: IsRemovingType
    doPostBusEvent: (submissionId: string, testType: string) => void
    isRemovingSubmission: IsRemovingType
    setShowConfirmDeleteDialog: Dispatch<SetStateAction<string | undefined>>
    doRemoveReviewSummations?: (reviewSummationId: string) => void
    isRemovingReviewSummations?: IsRemovingType
    setShowConfirmDeleteReviewSummationDialog?: Dispatch<SetStateAction<string | undefined>>
}

export const MarathonMatchScoreTableActions: FC<Props> = (props: Props) => {
    const [openDropdown, setOpenDropdown] = useState(false)

    const manageDropdownMenuTrigger = useEventCallback(
        (triggerProps: {
            open: boolean
            setOpen: Dispatch<SetStateAction<boolean>>
        }) => {
            function handleToggle(): void {
                triggerProps.setOpen(!triggerProps.open)
            }

            return (
                <Button primary onClick={handleToggle}>
                    Action
                    {' '}
                    <ChevronDownIcon className='icon icon-fill' />
                </Button>
            )
        },
    )

    const testLabel = props.testType === 'system'
        ? 'System'
        : 'Provisional'

    const testStatusKey = `${props.submissionId}_${props.testType}`

    function handleRerunTest(): void {
        if (props.isRunningTest[testStatusKey]) {
            return
        }

        setOpenDropdown(false)
        props.doPostBusEvent(props.submissionId, props.testType)
    }

    function handleDeleteSubmission(): void {
        if (props.isRemovingSubmission[props.submissionId]) {
            return
        }

        props.setShowConfirmDeleteDialog(props.submissionId)
        setOpenDropdown(false)
    }

    function handleDeleteReviewSummation(): void {
        const reviewSummationId = props.reviewSummationId
        if (
            !reviewSummationId
            || !props.doRemoveReviewSummations
            || !props.setShowConfirmDeleteReviewSummationDialog
        ) {
            return
        }

        if (props.isRemovingReviewSummations?.[reviewSummationId]) {
            return
        }

        props.setShowConfirmDeleteReviewSummationDialog(reviewSummationId)
        setOpenDropdown(false)
    }

    return (
        <DropdownMenu
            trigger={manageDropdownMenuTrigger}
            open={openDropdown}
            setOpen={setOpenDropdown}
            width={250}
            placement='bottom-end'
            shouldIgnoreWhenClickMenu
        >
            <ul>
                <li
                    className={classNames({
                        disabled: props.isRunningTest[testStatusKey],
                    })}
                    onClick={handleRerunTest}
                >
                    Re-run
                    {' '}
                    {testLabel}
                    {' '}
                    Test
                </li>
                <li
                    className={classNames({
                        disabled: props.isRemovingSubmission[props.submissionId],
                    })}
                    onClick={handleDeleteSubmission}
                >
                    Delete Submission
                </li>
                {props.reviewSummationId
                    && props.doRemoveReviewSummations
                    && props.setShowConfirmDeleteReviewSummationDialog && (
                    <li
                        className={classNames({
                            disabled: Boolean(
                                props.isRemovingReviewSummations?.[props.reviewSummationId],
                            ),
                        })}
                        onClick={handleDeleteReviewSummation}
                    >
                        Delete Review Summation
                    </li>
                )}
            </ul>
        </DropdownMenu>
    )
}

export default MarathonMatchScoreTableActions
