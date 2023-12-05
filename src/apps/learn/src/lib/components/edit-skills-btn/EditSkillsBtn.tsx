import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconOutline } from '~/libs/ui'

import styles from './EditSkillsBtn.module.scss'

interface EditSkillsBtnProps {
    className?: string
    onClick: () => void
}

const EditSkillsBtn: FC<EditSkillsBtnProps> = (props: EditSkillsBtnProps) => (
    <Button
        icon={IconOutline.PencilIcon}
        onClick={props.onClick}
        className={classNames(styles.editSkillsBtn, props.className)}
        size='md'
    />
)

export default EditSkillsBtn
