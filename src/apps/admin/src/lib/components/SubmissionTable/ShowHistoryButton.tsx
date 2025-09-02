/**
 * Submission Table Actions For Non MM Challenge.
 */
import { Dispatch, FC, SetStateAction } from 'react'

import { Button } from '~/libs/ui'

import { IsRemovingType, Submission } from '../../models'

interface Props {
    data: Submission
    showSubmissionHistory: IsRemovingType
    setShowSubmissionHistory: Dispatch<SetStateAction<IsRemovingType>>
}

export const ShowHistoryButton: FC<Props> = (props: Props) => (
    <Button
        onClick={function onClick() {
            props.setShowSubmissionHistory(prev => ({
                ...prev,
                [props.data.id]: !prev[props.data.id],
            }))
        }}
    >
        {props.showSubmissionHistory[props.data.id] ? 'Hide' : 'Show'}
        {' '}
        History
    </Button>
)

export default ShowHistoryButton
