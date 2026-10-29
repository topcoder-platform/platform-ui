import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import { copyTextToClipboard } from '~/libs/shared'
import { Button } from '~/libs/ui'

import { EngagementLeadsTab } from '../../../lib/components'
import { ENGAGEMENTS_APP_URL } from '../../../lib/constants'
import { EngagementLeadType } from '../../../lib/models/EngagementLead.model'
import {
    extractErrorMessage,
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'
import {
    getLeadIntakeUrl,
    getLeadTypeFromTabParam,
    getLeadTypeTabParam,
    getWiproDirectLeadIntakeUrl,
    LEAD_TYPE_TAB_PARAM,
} from '../../../lib/utils/engagement-leads.utils'

import styles from './EngagementLeadsListPage.module.scss'

const LEAD_TABS: Array<{ label: string; leadType: EngagementLeadType }> = [
    { label: 'Wipro Consumption Leads', leadType: EngagementLeadType.WIPRO_CONSUMPTION },
    { label: 'Wipro Direct Leads', leadType: EngagementLeadType.WIPRO_DIRECT },
]

export const EngagementLeadsListPage: FC = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeLeadType = getLeadTypeFromTabParam(searchParams.get(LEAD_TYPE_TAB_PARAM))

    const intakeUrl = useMemo(() => getLeadIntakeUrl(ENGAGEMENTS_APP_URL), [])
    const wiproDirectIntakeUrl = useMemo(() => getWiproDirectLeadIntakeUrl(ENGAGEMENTS_APP_URL), [])

    const copyLink = useCallback(async (url: string): Promise<void> => {
        try {
            await copyTextToClipboard(url)
            showSuccessToast('Lead intake form link copied to clipboard.')
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to copy link.'))
        }
    }, [])

    const handleCopyConsumptionLink = useCallback((): void => {
        copyLink(intakeUrl)
            .catch(() => undefined)
    }, [copyLink, intakeUrl])

    const handleCopyWiproDirectLink = useCallback((): void => {
        copyLink(wiproDirectIntakeUrl)
            .catch(() => undefined)
    }, [copyLink, wiproDirectIntakeUrl])

    const handleTabClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const leadType = event.currentTarget.dataset.leadType as EngagementLeadType
        setSearchParams({ [LEAD_TYPE_TAB_PARAM]: getLeadTypeTabParam(leadType) })
    }, [setSearchParams])

    return (
        <PageWrapper
            breadCrumb={[]}
            pageTitle='Leads'
        >
            <div className={styles.container}>
                <div className={styles.header}>
                    <p className={styles.description}>
                        Review engagement requirements submitted through the public intake forms.
                    </p>
                    <div className={styles.headerActions}>
                        <Button
                            label='Copy Wipro Consumption Lead Form Link'
                            onClick={handleCopyConsumptionLink}
                            primary
                            size='md'
                        />
                        <Button
                            label='Copy Wipro Direct Lead Form Link'
                            onClick={handleCopyWiproDirectLink}
                            primary
                            size='md'
                        />
                    </div>
                </div>

                <div className={styles.tabs} role='tablist'>
                    {LEAD_TABS.map(tab => (
                        <button
                            key={tab.leadType}
                            aria-selected={tab.leadType === activeLeadType}
                            className={classNames(
                                styles.tab,
                                tab.leadType === activeLeadType && styles.active,
                            )}
                            data-lead-type={tab.leadType}
                            role='tab'
                            type='button'
                            onClick={handleTabClick}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Keyed so each tab starts from its own default filters. */}
                <EngagementLeadsTab key={activeLeadType} leadType={activeLeadType} />
            </div>
        </PageWrapper>
    )
}

export default EngagementLeadsListPage
