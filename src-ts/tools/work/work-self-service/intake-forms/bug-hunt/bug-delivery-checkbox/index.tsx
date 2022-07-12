import cn from 'classnames'
import React from 'react'

import { GithubIcon, GithubSelectedIcon, GitlabIcon, GitlabSelectedIcon } from '../../../../../../lib'

import styles from './BugDeliveryCheckbox.module.scss'

interface BugDeliveryCheckboxProps {
    name: string
    selected?: boolean
}

const BugDeliveryCheckbox: React.FC<BugDeliveryCheckboxProps> = ({ name, selected }: BugDeliveryCheckboxProps) => {
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
        <div className={cn(styles['bug-delivery-checkbox'], selected && styles['selected'])}>
            {getOptionIcon()}
            <div className={styles['name']}>{name}</div>
        </div>
    )
}

export default BugDeliveryCheckbox
