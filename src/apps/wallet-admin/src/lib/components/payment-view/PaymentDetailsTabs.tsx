import { FC } from 'react'
import classNames from 'classnames'

import styles from './PaymentView.module.scss'

export interface PaymentDetailsTabOption {
    id: string
    label: string
}

interface PaymentDetailsTabsProps {
    readonly activeTabId: string
    readonly onTabChange: (tabId: string) => void
    readonly tabs: ReadonlyArray<PaymentDetailsTabOption>
}

const PaymentDetailsTabs: FC<PaymentDetailsTabsProps> = (props: PaymentDetailsTabsProps) => (
    <div className={styles.tabList} role='tablist'>
        {props.tabs.map(tab => (
            <button
                key={tab.id}
                type='button'
                role='tab'
                aria-selected={props.activeTabId === tab.id}
                className={classNames(styles.tabButton, {
                    [styles.tabButtonActive]: props.activeTabId === tab.id,
                })}
                onClick={() => props.onTabChange(tab.id)}
            >
                {tab.label}
            </button>
        ))}
    </div>
)

export default PaymentDetailsTabs
