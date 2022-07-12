import React from 'react'

import { GithubIcon, GitlabIcon } from '../../../../../../lib'

import styles from './BugDeliveryCheckbox.module.scss'

interface BugDeliveryCheckboxProps {
    name: string
}

const BugDeliveryCheckbox: React.FC<BugDeliveryCheckboxProps> = ({ name }: BugDeliveryCheckboxProps) => {
    const getOptionIcon: () => JSX.Element = () => {
        return name === 'GitHub' ? <GitlabIcon /> : <GithubIcon />
    }

    return (
        <div className={styles['bug-delivery-checkbox']}>
            {getOptionIcon()}
            <div className={styles['name']}>{name}</div>
        </div>
    )
}

export default BugDeliveryCheckbox
