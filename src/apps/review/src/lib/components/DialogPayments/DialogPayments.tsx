/**
 * Dialog to show Payments for a challenge (active and past).
 */
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { BaseModal, LoadingSpinner } from '~/libs/ui'
import { IconOutline } from '~/libs/ui/lib/components/svgs'

import { ChallengeDetailContext } from '../../contexts'
import type { ChallengeDetailContextModel } from '../../models'
import { fetchMemberHandles, fetchWinningsByExternalId, WinningDetailDto } from '../../services'

import styles from './DialogPayments.module.scss'

interface Props {
    open: boolean
    setOpen: (isOpen: boolean) => void
}

type ActiveRow = { description: string, handle?: string, amount: string }
type PastRow = { id: string, description: string, handle: string, amount: string, paid: boolean }

const formatCurrency = (amount: number | string, currency?: string): string => {
    const n = typeof amount === 'number' ? amount : Number(amount)
    if (Number.isNaN(n)) return String(amount)

    const normalizedCurrency = (currency || 'USD').toUpperCase()
    if (normalizedCurrency === 'POINT') {
        return `${n.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
        })} Points`
    }

    try {
        const nf = new Intl.NumberFormat('en-US', {
            currency: normalizedCurrency,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
            style: 'currency',
        })
        return nf.format(n)
    } catch (err) {
        // Fallback for any non-ISO currency codes
        return `${normalizedCurrency} ${n.toLocaleString('en-US', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        })}`
    }
}

const ordinal = (i: number): string => {
    const j = i % 10
    const k = i % 100
    if (j === 1 && k !== 11) return `${i}st`
    if (j === 2 && k !== 12) return `${i}nd`
    if (j === 3 && k !== 13) return `${i}rd`
    return `${i}th`
}

export const DialogPayments: FC<Props> = (props: Props) => {
    const { challengeId, challengeInfo, resources }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const challengeStatus = challengeInfo?.status?.toUpperCase()
    const isPast = useMemo(() => (
        challengeStatus === 'COMPLETED' || (challengeStatus?.startsWith('CANCELLED') ?? false)
    ), [challengeStatus])

    const [isLoading, setIsLoading] = useState(false)
    const [activeRows, setActiveRows] = useState<ActiveRow[]>([])
    const [pastRows, setPastRows] = useState<PastRow[]>([])
    const [error, setError] = useState<string | undefined>(undefined)

    // Build rows for active challenge from prizeSets + winners + copilot resources
    useEffect(() => {
        if (!props.open || isPast || !challengeInfo) return
        const rows: ActiveRow[] = []

        const prizeSets = challengeInfo.prizeSets || []
        // Placement prizes
        const placementSet = prizeSets.find(ps => (ps.type || '').toLowerCase() === 'placement')
        if (placementSet) {
            placementSet.prizes.forEach((p, idx) => {
                const placement = idx + 1
                const winnerHandle = challengeInfo.winners?.find(w => w.placement === placement)?.handle
                rows.push({
                    amount: formatCurrency(p.value, (p as any)?.type || 'USD'),
                    description: `${ordinal(placement)} place`,
                    handle: winnerHandle,
                })
            })
        }

        // Copilot prizes — assign to each copilot resource
        const copilotSet = prizeSets.find(ps => (ps.type || '').toLowerCase() === 'copilot')
        if (copilotSet) {
            const copilotAmount = copilotSet.prizes.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
            const copilotCurrency = (copilotSet.prizes[0] as any)?.type || 'USD'
            const copilotResources = (resources || []).filter(r => {
                const rn = (r.roleName || '').toLowerCase()
                return rn.includes('copilot')
            })
            copilotResources.forEach(cp => {
                rows.push({
                    amount: formatCurrency(copilotAmount, copilotCurrency),
                    description: 'Copilot',
                    handle: cp.memberHandle,
                })
            })
        }

        setActiveRows(rows)
    }, [props.open, isPast, challengeInfo, resources])

    // Build rows for past challenge by querying winnings by externalId
    useEffect(() => {
        const run = async (): Promise<void> => {
            if (!props.open || !isPast || !challengeId) return
            setIsLoading(true)
            setError(undefined)
            try {
                const winnings: WinningDetailDto[] = await fetchWinningsByExternalId(challengeId)
                const uniqWinnerIds = Array.from(new Set(winnings.map(w => w.winnerId)))
                const winnerIds = uniqWinnerIds.filter(Boolean)
                const handleMap = await fetchMemberHandles(winnerIds)

                const rows: PastRow[] = winnings.map(w => {
                    const detail = w.details?.[0]
                    const amount = detail?.totalAmount ?? '0'
                    const paid = (detail?.status || '').toUpperCase() === 'PAID' || Boolean(detail?.datePaid)
                    const handle = handleMap.get(Number(w.winnerId)) || w.winnerId
                    const amountStr = formatCurrency(amount, detail?.currency || 'USD')
                    return {
                        amount: amountStr,
                        description: w.description,
                        handle: String(handle),
                        id: w.id,
                        paid,
                    }
                })
                setPastRows(rows)
            } catch (err) {
                setError((err as Error)?.message || 'Failed to fetch payments')
            } finally {
                setIsLoading(false)
            }
        }

        run()
    }, [props.open, isPast, challengeId])

    const handleClose = useCallback(() => {
        props.setOpen(false)
    }, [props])

    return (
        <BaseModal
            open={props.open}
            onClose={handleClose}
            title='Payments'
            size='lg'
            classNames={{ modal: styles.modal }}
            allowBodyScroll
        >
            {isPast ? (
                <div className={classNames('enhanced-table', styles.tableWrap)}>
                    {isLoading && (
                        <div className={styles.loadingWrap}><LoadingSpinner /></div>
                    )}
                    {error && (
                        <div className={styles.error}>
                            Error:
                            {' '}
                            {error}
                        </div>
                    )}
                    {!isLoading && !error && (
                        <table className={styles.table}>
                            <thead className={styles.headerRow}>
                                <tr>
                                    <th className={styles.th}>Description</th>
                                    <th className={styles.th}>Handle</th>
                                    <th className={styles.th}>Amount</th>
                                    <th className={styles.th}>Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastRows.map(r => (
                                    <tr key={r.id}>
                                        <td className={styles.td}>{r.description}</td>
                                        <td className={styles.td}>{r.handle}</td>
                                        <td className={styles.td}>{r.amount}</td>
                                        <td className={classNames(styles.td, styles.paidCell)}>
                                            {r.paid
                                                ? (
                                                    <IconOutline.CheckCircleIcon
                                                        className={styles.green}
                                                        width={20}
                                                        height={20}
                                                    />
                                                )
                                                : (
                                                    <span className={styles.empty}>—</span>
                                                )}
                                        </td>
                                    </tr>
                                ))}
                                {pastRows.length === 0 && (
                                    <tr>
                                        <td className={styles.td} colSpan={4}>No payments found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className={classNames('enhanced-table', styles.tableWrap)}>
                    <table className={styles.table}>
                        <thead className={styles.headerRow}>
                            <tr>
                                <th className={styles.th}>Description</th>
                                <th className={styles.th}>Handle</th>
                                <th className={styles.th}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activeRows.map(r => (
                                <tr key={`${r.description}-${r.handle || ''}-${r.amount}`}>
                                    <td className={styles.td}>{r.description}</td>
                                    <td className={styles.td}>{r.handle || <span className={styles.empty}>—</span>}</td>
                                    <td className={styles.td}>{r.amount}</td>
                                </tr>
                            ))}
                            {activeRows.length === 0 && (
                                <tr>
                                    <td className={styles.td} colSpan={3}>No payments found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </BaseModal>
    )
}

export default DialogPayments
