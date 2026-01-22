/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { useLocation } from 'react-router-dom'
import React, { FC, useEffect, useRef, useState } from 'react'

import { UserProfile } from '~/libs/core'

import PaymentsListView from './PaymentsListView'
import PointsListView from './PointsListView'
import styles from './Winnings.module.scss'

interface WinningsTabProps {
    profile: UserProfile
}

const WinningsTab: FC<WinningsTabProps> = (props: WinningsTabProps) => {
    const location = useLocation()
    const pointsRef = useRef<HTMLDivElement>(null)
    const [paymentsCollapsed, setPaymentsCollapsed] = useState(false)
    const [pointsCollapsed, setPointsCollapsed] = useState(false)

    useEffect(() => {
        // Parse URL query parameters from hash
        const hashParts = location.hash.split('?')
        if (hashParts.length > 1) {
            const searchParams = new URLSearchParams(hashParts[1])
            const type = searchParams.get('type')

            if (type === 'points') {
                // Collapse payments and scroll to points
                setPaymentsCollapsed(true)
                setPointsCollapsed(false)

                // Scroll to points section after a short delay to allow rendering
                setTimeout(() => {
                    pointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
            }
        }
    }, [location.hash])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Winnings</h3>
            </div>
            <div className={styles.content}>
                <PaymentsListView
                    profile={props.profile}
                    isCollapsed={paymentsCollapsed}
                    onToggle={setPaymentsCollapsed}
                />
                <div ref={pointsRef}>
                    <PointsListView
                        profile={props.profile}
                        isCollapsed={pointsCollapsed}
                        onToggle={setPointsCollapsed}
                    />
                </div>
            </div>
        </div>
    )
}

export default WinningsTab
