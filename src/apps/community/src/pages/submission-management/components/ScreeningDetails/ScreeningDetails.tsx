import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { Button } from '~/libs/ui'

import styles from './ScreeningDetails.module.scss'

interface ScreeningWarning {
    brief?: string
    details?: string
}

interface ScreeningObject {
    status?: string
    warnings?: ScreeningWarning[]
}

interface ScreeningDetailsProps {
    screeningObject?: ScreeningObject
    submissionId: string
}

interface ScreeningStatusInfo {
    className: string
    message: string
    title: string
}

function resolveScreeningStatusInfo(
    screeningObject: ScreeningObject | undefined,
): ScreeningStatusInfo {
    const status = (screeningObject?.status || '').toLowerCase()
    const warnings = screeningObject?.warnings ?? []
    const hasWarnings = warnings.length > 0

    if (status === 'pending') {
        return {
            className: styles.pending,
            message: 'Your submission has been received and will be screened after the phase ends.',
            title: 'Pending',
        }
    }

    if (status === 'passed' && !hasWarnings) {
        return {
            className: styles.passed,
            message: 'You have passed screening.',
            title: 'Passed Screening',
        }
    }

    if (status === 'failed' && !hasWarnings) {
        return {
            className: styles.failed,
            message: 'You have failed screening.',
            title: 'Failed Screening',
        }
    }

    if (status === 'passed' && hasWarnings) {
        return {
            className: styles.passed,
            message: `You passed screening with ${warnings.length} warning(s).`,
            title: 'Passed Screening With Warnings',
        }
    }

    if (status === 'failed' && hasWarnings) {
        return {
            className: styles.failed,
            message: 'You failed screening and received warning details.',
            title: 'Failed Screening With Warnings',
        }
    }

    return {
        className: styles.pending,
        message: 'Your submission may undergo AI-assisted review during the submission phase.',
        title: 'Screening Status',
    }
}

/**
 * Renders screening status and warning details for one submission.
 *
 * @param props Screening payload and submission identifier.
 * @returns Screening details block.
 */
const ScreeningDetails: FC<ScreeningDetailsProps> = (props: ScreeningDetailsProps) => {
    const [expanded, setExpanded] = useState<boolean>(false)
    const warnings = props.screeningObject?.warnings ?? []
    const statusInfo = useMemo(
        () => resolveScreeningStatusInfo(props.screeningObject),
        [props.screeningObject],
    )
    const handleToggleExpanded = useCallback((): void => {
        setExpanded(previous => !previous)
    }, [])

    return (
        <div className={styles.container} data-submission-id={props.submissionId}>
            <div className={styles.header}>
                <p className={classNames(styles.title, statusInfo.className)}>
                    {statusInfo.title}
                </p>
                {warnings.length > 0 && (
                    <Button
                        label={expanded ? 'Hide Details' : 'Show Details'}
                        onClick={handleToggleExpanded}
                        secondary
                    />
                )}
            </div>

            <p className={styles.message}>{statusInfo.message}</p>

            {expanded && warnings.length > 0 && (
                <div className={styles.warnings}>
                    {warnings.map((warning, index) => (
                        <div
                            className={styles.warningItem}
                            key={`${props.submissionId}-${warning.brief || ''}-${warning.details || ''}`}
                        >
                            <p className={styles.warningTitle}>
                                Warning
                                {' '}
                                {index + 1}
                                :
                                {' '}
                                {warning.brief || 'Details'}
                            </p>
                            <p className={styles.warningDetail}>{warning.details}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export { ScreeningDetails }
export default ScreeningDetails
