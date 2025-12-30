import { FC, MouseEvent } from 'react'

import { CopyButton } from './CopyButton'
import type { StepRequestLog } from './Runner'
import styles from './RequestDetailModal.module.scss'

type Props = {
    isOpen: boolean
    stepTitle: string
    request?: StepRequestLog
    onClose: () => void
}

const stringifyValue = (value: unknown): string => {
    const normalized = value ?? undefined
    if (normalized === undefined) {
        return ''
    }

    if (typeof normalized === 'string') {
        return normalized
    }

    try {
        return JSON.stringify(normalized, undefined, 2)
    } catch {
        return String(normalized)
    }
}

// eslint-disable-next-line complexity
export const RequestDetailModal: FC<Props> = (props: Props) => {
    if (!props.isOpen || !props.request) {
        return <></>
    }

    function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
        if (event.target === event.currentTarget) {
            props.onClose()
        }
    }

    const endpointDisplay = props.request.endpoint || 'Unknown'
    const requestBodyDisplay = stringifyValue(props.request.requestBody)
    const responseBodyDisplay = stringifyValue(props.request.responseBody)
    const responseHeadersDisplay = props.request.responseHeaders
        ? stringifyValue(props.request.responseHeaders)
        : ''

    return (
        <div
            className={styles.modal}
            onClick={handleOverlayClick}
            role='dialog'
            aria-modal='true'
            aria-label='Request details'
        >
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3>Request details</h3>
                        <p className={styles.subtitle}>{props.stepTitle}</p>
                    </div>
                    <button type='button' className='borderButton' onClick={props.onClose}>
                        Close
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.detailRow}>
                        <div>
                            <span className={styles.detailLabel}>Endpoint</span>
                            <div className={styles.detailValue}>{endpointDisplay}</div>
                        </div>
                        <CopyButton value={props.request.endpoint} label='Copy endpoint' />
                    </div>

                    <div className={styles.detailGrid}>
                        <div>
                            <span className={styles.detailLabel}>Method</span>
                            <div className={styles.detailValue}>{props.request.method || 'Unknown'}</div>
                        </div>
                        <div>
                            <span className={styles.detailLabel}>Status code</span>
                            <div className={styles.detailValue}>{props.request.status ?? 'Unknown'}</div>
                        </div>
                        <div>
                            <span className={styles.detailLabel}>Outcome</span>
                            <div
                                className={
                                    props.request.outcome === 'failure'
                                        ? styles.outcomeFailure
                                        : styles.outcomeSuccess
                                }
                            >
                                {props.request.outcome === 'failure' ? 'Failure' : 'Success'}
                            </div>
                        </div>
                    </div>

                    {props.request.message ? (
                        <div>
                            <span className={styles.detailLabel}>Message</span>
                            <div className={styles.detailValue}>{props.request.message}</div>
                        </div>
                    ) : undefined}

                    {typeof props.request.durationMs === 'number' ? (
                        <div>
                            <span className={styles.detailLabel}>Duration</span>
                            <div className={styles.detailValue}>
                                {props.request.durationMs}
                                ms
                            </div>
                        </div>
                    ) : undefined}

                    {props.request.timestamp ? (
                        <div>
                            <span className={styles.detailLabel}>Timestamp</span>
                            <div className={styles.detailValue}>
                                {new Date(props.request.timestamp)
                                    .toLocaleString()}
                            </div>
                        </div>
                    ) : undefined}

                    <div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Request body</span>
                            <CopyButton value={requestBodyDisplay} label='Copy request body' />
                        </div>
                        <pre className={styles.codeBlock}>{requestBodyDisplay || 'No body captured.'}</pre>
                    </div>

                    <div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Response body</span>
                            <CopyButton value={responseBodyDisplay} label='Copy response body' />
                        </div>
                        <pre className={styles.codeBlock}>{responseBodyDisplay || 'No body captured.'}</pre>
                    </div>

                    {responseHeadersDisplay ? (
                        <div>
                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Response headers</span>
                                <CopyButton value={responseHeadersDisplay} label='Copy response headers' />
                            </div>
                            <pre className={styles.codeBlock}>{responseHeadersDisplay}</pre>
                        </div>
                    ) : undefined}
                </div>
            </div>
        </div>
    )
}

export default RequestDetailModal
