import {
    FC,
    useCallback,
    useMemo,
} from 'react'

import { copyTextToClipboard } from '~/libs/shared'
import { Button } from '~/libs/ui'

import { ENGAGEMENTS_APP_URL } from '../../constants'
import { EngagementLeadType } from '../../models/EngagementLead.model'
import {
    extractErrorMessage,
    showErrorToast,
    showSuccessToast,
} from '../../utils'
import { getLeadIntakeUrl } from '../../utils/engagement-leads.utils'
import { EngagementLeadsTab } from '../EngagementLeadsTab'

import styles from './EngagementLeadsPanel.module.scss'

/**
 * Engagement leads submitted through the Wipro Consumption intake form, with the form link.
 */
export const EngagementLeadsPanel: FC = () => {
    const intakeUrl = useMemo(() => getLeadIntakeUrl(ENGAGEMENTS_APP_URL), [])

    const handleCopyLink = useCallback((): void => {
        copyTextToClipboard(intakeUrl)
            .then(() => showSuccessToast('Lead intake form link copied to clipboard.'))
            .catch((err: unknown) => showErrorToast(extractErrorMessage(err, 'Unable to copy link.')))
    }, [intakeUrl])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <p className={styles.description}>
                    Review engagement requirements submitted through the public intake form.
                </p>
                <div className={styles.headerActions}>
                    <Button
                        label='Copy Lead Form Link'
                        onClick={handleCopyLink}
                        primary
                        size='md'
                    />
                </div>
            </div>

            <EngagementLeadsTab leadType={EngagementLeadType.WIPRO_CONSUMPTION} />
        </div>
    )
}

export default EngagementLeadsPanel
