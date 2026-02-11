import { FC } from 'react'

import {
    FormRadioGroup,
    FormRadioOption,
} from '../../../../../lib/components/form'

const discussionForumOptions: FormRadioOption<boolean>[] = [
    {
        label: 'On',
        value: true,
    },
    {
        label: 'Off',
        value: false,
    },
]

export const DiscussionForumField: FC = () => (
    <FormRadioGroup
        label='Forum Discussion'
        name='discussionForum'
        options={discussionForumOptions}
    />
)

export default DiscussionForumField
