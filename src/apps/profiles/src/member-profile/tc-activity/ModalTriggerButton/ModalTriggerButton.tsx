import { FC, SVGProps } from 'react'

import { ChevronRightIcon } from '@heroicons/react/outline'
import { Button } from '~/libs/ui'

import styles from './ModalTriggerButton.module.scss'

interface ModalTriggerButtonProps {
    icon?: FC<SVGProps<SVGSVGElement>>
    onClick: () => void
}

const ModalTriggerButton: FC<ModalTriggerButtonProps> = (props: ModalTriggerButtonProps) => (
    <Button
        icon={props.icon || ChevronRightIcon}
        size='lg'
        className={styles.btn}
        onClick={props.onClick}
    />
)

export default ModalTriggerButton
