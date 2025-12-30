import { FC, MouseEvent } from 'react'

import type { StepRequestLog } from './Runner'
import styles from './RequestModal.module.scss'

type Props = {
    isOpen: boolean
    stepTitle: string
    requests: StepRequestLog[]
    onClose: () => void
    onSelect: (request: StepRequestLog) => void
}

export const RequestModal: FC<Props> = (props: Props) => {
    const requestLookup = new Map<string, StepRequestLog>()
    props.requests.forEach(request => {
        requestLookup.set(request.id, request)
    })

    function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
        if (event.target === event.currentTarget) {
            props.onClose()
        }
    }

    function handleSelectClick(event: MouseEvent<HTMLButtonElement>): void {
        const requestId = event.currentTarget.dataset.requestId
        if (!requestId) {
            return
        }

        const request = requestLookup.get(requestId)
        if (request) {
            props.onSelect(request)
        }
    }

    if (!props.isOpen) {
        return <></>
    }

    return (
        <div
            className={styles.modal}
            onClick={handleOverlayClick}
            role='dialog'
            aria-modal='true'
            aria-label='Step requests'
        >
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <div>
                        <h3>Step requests</h3>
                        <p className={styles.subtitle}>{props.stepTitle}</p>
                    </div>
                    <button type='button' className='borderButton' onClick={props.onClose}>
                        Close
                    </button>
                </div>
                <div className={styles.modalBody}>
                    {props.requests.length === 0 ? (
                        <div className={styles.emptyState}>
                            No requests were captured for this step yet.
                        </div>
                    ) : (
                        <div className={styles.requestList}>
                            {props.requests.map(request => {
                                const summary = [request.method, request.endpoint]
                                    .filter(Boolean)
                                    .join(' ')
                                const statusLabel = request.status !== undefined
                                    ? String(request.status)
                                    : 'N/A'
                                const outcomeLabel = request.outcome === 'failure'
                                    ? 'Failure'
                                    : 'Success'
                                const timestampLabel = request.timestamp
                                    ? new Date(request.timestamp)
                                        .toLocaleTimeString()
                                    : undefined

                                return (
                                    <div key={request.id} className={styles.requestCard}>
                                        <div className={styles.requestInfo}>
                                            <div className={styles.requestTitle}>
                                                {summary || request.message || 'Request'}
                                            </div>
                                            <div className={styles.requestMeta}>
                                                <span className={styles.statusBadge}>
                                                    {statusLabel}
                                                </span>
                                                <span
                                                    className={
                                                        request.outcome === 'failure'
                                                            ? styles.statusFailure
                                                            : styles.statusSuccess
                                                    }
                                                >
                                                    {outcomeLabel}
                                                </span>
                                                {timestampLabel ? (
                                                    <span>{timestampLabel}</span>
                                                ) : undefined}
                                                {typeof request.durationMs === 'number' ? (
                                                    <span>
                                                        {request.durationMs}
                                                        ms
                                                    </span>
                                                ) : undefined}
                                                {request.message ? (
                                                    <span>{request.message}</span>
                                                ) : undefined}
                                            </div>
                                        </div>
                                        <button
                                            type='button'
                                            className='borderButton'
                                            data-request-id={request.id}
                                            onClick={handleSelectClick}
                                        >
                                            View details
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default RequestModal
