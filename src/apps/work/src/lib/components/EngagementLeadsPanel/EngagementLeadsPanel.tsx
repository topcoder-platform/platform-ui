import {
    FC,
    useCallback,
    useMemo,
    useState,
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
import { FlexiTalentCalculatorModal } from '../FlexiTalentCalculatorModal'

import styles from './EngagementLeadsPanel.module.scss'

/**
 * Engagement leads submitted through the Wipro Consumption intake form, with the form link and a
 * general cost calculator for figures that are not about any one lead.
 */
export const EngagementLeadsPanel: FC = () => {
    const intakeUrl = useMemo(() => getLeadIntakeUrl(ENGAGEMENTS_APP_URL), [])
    const [calculatorOpen, setCalculatorOpen] = useState<boolean>(false)

    const handleCalculatorOpen = useCallback((): void => {
        setCalculatorOpen(true)
    }, [])

    const handleCalculatorClose = useCallback((): void => {
        setCalculatorOpen(false)
    }, [])

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
                        label='Cost Calculator'
                        onClick={handleCalculatorOpen}
                        secondary
                        size='md'
                    />
                    <Button
                        label='Copy Lead Form Link'
                        onClick={handleCopyLink}
                        primary
                        size='md'
                    />
                </div>
            </div>

            <EngagementLeadsTab leadType={EngagementLeadType.WIPRO_CONSUMPTION} />

            {calculatorOpen && (
                <FlexiTalentCalculatorModal onClose={handleCalculatorClose} />
            )}
        </div>
    )
}

export default EngagementLeadsPanel
