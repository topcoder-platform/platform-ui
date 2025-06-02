/**
 * Submission Table Actions.
 */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import classNames from 'classnames'

import { ChevronDownIcon } from '@heroicons/react/solid'
import { Button } from '~/libs/ui'

import { DropdownMenu } from '../common/DropdownMenu'
import { useEventCallback } from '../../hooks'
import { IsRemovingType, Submission } from '../../models'

interface Props {
    data: Submission
    isRunningTest: IsRemovingType
    isRemovingSubmission: IsRemovingType
    isRemovingReviewSummations: IsRemovingType
    doPostBusEvent: (submissionId: string, testType: string) => void
    setShowConfirmDeleteSubmissionDialog: Dispatch<
        SetStateAction<Submission | undefined>
    >
    setShowConfirmDeleteReviewsDialog: Dispatch<
        SetStateAction<Submission | undefined>
    >
}

export const SubmissionTableActions: FC<Props> = (props: Props) => {
    const [openDropdown, setOpenDropdown] = useState(false)
    const manageDropdownMenuTrigger = useEventCallback(
        (triggerProps: {
            open: boolean
            setOpen: Dispatch<SetStateAction<boolean>>
        }) => {
            const createToggle = () => (): void => triggerProps.setOpen(!triggerProps.open)
            return (
                <Button primary onClick={createToggle()}>
                    Action
                    {' '}
                    <ChevronDownIcon className='icon icon-fill' />
                </Button>
            )
        },
    )

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
                {props.data.isTheLatestSubmission && (
                    <li
                        className={classNames({
                            disabled:
                                props.isRunningTest[`${props.data.id}_system`],
                        })}
                        onClick={function onClick() {
                            setOpenDropdown(false)
                            props.doPostBusEvent(props.data.id, 'system')
                        }}
                    >
                        Run System Test
                    </li>
                )}
                <li
                    className={classNames({
                        disabled:
                            props.isRunningTest[`${props.data.id}_provisional`],
                    })}
                    onClick={function onClick() {
                        setOpenDropdown(false)
                        props.doPostBusEvent(props.data.id, 'provisional')
                    }}
                >
                    Run Provisional Test
                </li>
                <li
                    className={classNames({
                        disabled: props.isRemovingSubmission[props.data.id],
                    })}
                    onClick={function onClick() {
                        props.setShowConfirmDeleteSubmissionDialog(props.data)
                        setOpenDropdown(false)
                    }}
                >
                    Delete Submission
                </li>
                <li
                    className={classNames({
                        disabled:
                            props.isRemovingReviewSummations[props.data.id]
                            || !props.data.reviewSummation?.length,
                    })}
                    onClick={function onClick() {
                        props.setShowConfirmDeleteReviewsDialog(props.data)
                        setOpenDropdown(false)
                    }}
                >
                    Delete Review Summations
                </li>
            </ul>
        </DropdownMenu>
    )
}

export default SubmissionTableActions
