import { FC } from 'react'

import { Button, IconOutline } from '~/libs/ui'

interface EditMemberPropertyBtnProps {
    onClick: () => void
}

const EditMemberPropertyBtn: FC<EditMemberPropertyBtnProps> = (props: EditMemberPropertyBtnProps) => (
    <Button
        icon={IconOutline.PencilIcon}
        onClick={props.onClick}
    />
)

export default EditMemberPropertyBtn
