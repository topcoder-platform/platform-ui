/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React, { FC, useState } from 'react'

import { UserProfile } from '~/libs/core'

import PaymentsListView from './PaymentsListView'
import PointsListView from './PointsListView'
import styles from './Payments.module.scss'

interface ListViewProps {
    profile: UserProfile
}

const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [paymentsCollapsed, setPaymentsCollapsed] = useState(false)
    const [pointsCollapsed, setPointsCollapsed] = useState(false)

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Member Payments</h3>
            </div>
            <div className={styles.content}>
                <PaymentsListView
                    profile={props.profile}
                    isCollapsed={paymentsCollapsed}
                    onToggle={setPaymentsCollapsed}
                />
                <PointsListView
                    profile={props.profile}
                    isCollapsed={pointsCollapsed}
                    onToggle={setPointsCollapsed}
                />
            </div>
        </div>
    )
}

export default ListView
