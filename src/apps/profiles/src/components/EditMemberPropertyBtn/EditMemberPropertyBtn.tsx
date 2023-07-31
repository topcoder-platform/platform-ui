import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconOutline } from '~/libs/ui'

import styles from './EditMemberPropertyBtn.module.scss'

interface EditMemberPropertyBtnProps {
    className?: string
    onClick: () => void
}

const EditMemberPropertyBtn: FC<EditMemberPropertyBtnProps> = (props: EditMemberPropertyBtnProps) => (
    <Button
        icon={IconOutline.PencilIcon}
        onClick={props.onClick}
        className={classNames(styles.editMemberPropertyBtn, props.className)}
        size='lg'
    />
)

export default EditMemberPropertyBtn
