import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconOutline } from '~/libs/ui'

import styles from './AddButton.module.scss'

interface AddButtonProps {
    className?: string
    label?: string
    onClick: () => void
    variant?: 'mt0'
}

const AddButton: FC<AddButtonProps> = props => (
    <div className={classNames(styles.wrap, props.variant, props.className)}>
        <Button
            icon={IconOutline.PlusIcon}
            onClick={props.onClick}
            className={styles.addButton}
            size='lg'
            label={props.label}
            link
            variant='linkblue'
        />
    </div>
)

export default AddButton
