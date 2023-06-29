import { FC } from 'react'

import { Button, IconOutline } from '~/libs/ui'

import styles from './EditMemberPropertyBtn.module.scss'

interface EditMemberPropertyBtnProps {
    onClick: () => void
}

const EditMemberPropertyBtn: FC<EditMemberPropertyBtnProps> = (props: EditMemberPropertyBtnProps) => (
    <Button
        icon={IconOutline.PencilIcon}
        onClick={props.onClick}
        className={styles.editMemberPropertyBtn}
    />
)

export default EditMemberPropertyBtn
