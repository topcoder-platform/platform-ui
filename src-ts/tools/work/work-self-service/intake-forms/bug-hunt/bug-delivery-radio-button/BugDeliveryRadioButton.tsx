import cn from 'classnames'
import React from 'react'

import { GithubIcon, GithubSelectedIcon, GitlabIcon, GitlabSelectedIcon } from '../../../../../../lib'

import styles from './BugDeliveryRadioButton.module.scss'

interface BugDeliveryRadioProps {
    name: string
    selected?: boolean
}

const BugDeliveryRadio: React.FC<BugDeliveryRadioProps> = ({ name, selected }: BugDeliveryRadioProps) => {
    const getOptionIcon: () => JSX.Element = () => {
        switch (name) {
            case 'GitHub':
                if (selected) {
                    return <GithubSelectedIcon />
                } else {
                    return <GithubIcon />
                }
            case 'GitLab':
            default:
                if (selected) {
                    return <GitlabSelectedIcon />
                } else {
                    return <GitlabIcon />
                }
        }
    }

    return (
        <div className={cn(styles['bug-delivery-radio'], selected && styles['selected'])}>
            {getOptionIcon()}
            <div className={styles['name']}>{name}</div>
        </div>
    )
}

export default BugDeliveryRadio
