import { FC, ReactNode } from 'react'
import _ from 'lodash'

import { BaseModal } from '~/libs/ui'

import styles from './styles.module.scss'

interface OnboardingBaseModalProps {
    onClose?: () => void
    children: React.ReactNode
    title?: string | ReactNode
    buttons?: ReactNode
}

const OnboardingBaseModal: FC<OnboardingBaseModalProps> = (props: OnboardingBaseModalProps) => (
    <BaseModal
        buttons={props.buttons}
        onClose={props.onClose || _.noop}
        open
        size='body'
        title={props.title}
        classNames={{ modal: styles.infoModal }}
    >
        {props.children}
    </BaseModal>
)

export default OnboardingBaseModal
