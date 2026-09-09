/* Pagination callbacks capture the current offset. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, useEffect, useRef, useState } from 'react'

import { Button } from '~/libs/ui/lib/components/button'
import { BaseModal } from '~/libs/ui/lib/components/modals/base-modal'

import { Segment, SegmentMemberPage } from '../contact.models'
import { contactError, contactGet } from '../contact.service'

import styles from './SegmentManager.module.scss'

interface Props {
    segment: Segment
    onClose: () => void
}

const PAGE_SIZE = 25

/**
 * Reads a saved segment's matching canonical members in bounded API pages.
 * @param props selected segment and close callback; membership is not a consented send audience.
 * @returns a focused, paginated handle/email table with explicit loading, empty and retry states.
 * @throws Request errors are displayed; responses from closed or superseded pages are ignored.
 */
export const SegmentMembersModal: FC<Props> = props => {
    const [offset, setOffset] = useState(0)
    const [page, setPage] = useState<SegmentMemberPage>()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [retry, setRetry] = useState(0)
    const headingRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError('')
        setPage(undefined)
        contactGet<SegmentMemberPage>(
            `segments/${encodeURIComponent(props.segment.id)}/members?limit=${PAGE_SIZE}&offset=${offset}`,
        )
            .then(response => {
                if (!active) return
                if (offset > 0 && offset >= response.total) {
                    setOffset(Math.max(0, Math.floor((response.total - 1) / PAGE_SIZE) * PAGE_SIZE))
                    return
                }

                setPage(response)
            })
            .catch(failure => { if (active) setError(contactError(failure)) })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [props.segment.id, offset, retry])

    return (
        <BaseModal
            open
            size='lg'
            title={(
                <h3 ref={headingRef} tabIndex={-1} id='contact-segment-members-title'>
                    Members in
                    {' '}
                    {props.segment.name}
                </h3>
            )}
            ariaLabelledby='contact-segment-members-title'
            initialFocusRef={headingRef}
            bodyClassName={styles.modalBody}
            onClose={props.onClose}
        >
            <p>All matching active members, before subscription consent and delivery eligibility checks.</p>
            {loading && <p role='status'>Loading members…</p>}
            {error && (
                <div className={styles.error} role='alert'>
                    <p>{error}</p>
                    <Button secondary label='Retry loading members' onClick={() => setRetry(value => value + 1)} />
                </div>
            )}
            {!loading && page && (
                <>
                    <div className={styles.tableScroll}>
                        <table className={styles.table} aria-label='Segment members'>
                            <thead>
                                <tr>
                                    <th scope='col'>Member handle</th>
                                    <th scope='col'>Email address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.members.map(member => (
                                    <tr key={member.memberId}>
                                        <td>{member.handle || member.memberId}</td>
                                        <td>{member.email || 'Unavailable'}</td>
                                    </tr>
                                ))}
                                {!page.members.length && (
                                    <tr><td colSpan={2} className={styles.empty}>No matching members.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.pagination}>
                        <p role='status'>
                            {page.total ? `${offset + 1}–${offset + page.members.length}` : '0'}
                            {' of '}
                            {page.total.toLocaleString()}
                            {' '}
                            members
                        </p>
                        <div className={styles.actions}>
                            <Button
                                secondary
                                label='Previous'
                                disabled={offset === 0}
                                onClick={() => setOffset(value => Math.max(0, value - PAGE_SIZE))}
                            />
                            <Button
                                secondary
                                label='Next'
                                disabled={offset + PAGE_SIZE >= page.total}
                                onClick={() => setOffset(value => value + PAGE_SIZE)}
                            />
                        </div>
                    </div>
                </>
            )}
            <div className={styles.footer}>
                <Button secondary size='lg' label='Close' onClick={props.onClose} />
            </div>
        </BaseModal>
    )
}
