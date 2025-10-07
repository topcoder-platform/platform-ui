/**
 * Challenge Phase Info.
 */
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { EnvironmentConfig } from '~/config'

import type { ChallengeInfo, ReviewAppContextModel } from '../../models'
import type { WinningDetailDto } from '../../services'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { useRole, useRoleProps } from '../../hooks'
import { fetchWinningsByExternalId } from '../../services'
import { ProgressBar } from '../ProgressBar'

import styles from './ChallengePhaseInfo.module.scss'

interface Props {
    className?: string
    challengeInfo: ChallengeInfo
    reviewProgress: number
    variant?: 'active' | 'past'
}

export const ChallengePhaseInfo: FC<Props> = (props: Props) => {
    const { myChallengeRoles }: useRoleProps = useRole()
    const { challengeId }: { challengeId?: string } = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const [paymentAmount, setPaymentAmount] = useState<string | undefined>(undefined)
    const [hasPayment, setHasPayment] = useState(false)
    const [isLoadingPayment, setIsLoadingPayment] = useState(false)
    const PROGRESS_TYPE = 'progress'

    const isTopgearTask = useMemo(() => {
        const t = (props.challengeInfo?.type || '').toString()
            .toLowerCase()
        return t === 'topgear task'
    }, [props.challengeInfo?.type])

    const walletUrl = useMemo(
        () => `https://wallet.${EnvironmentConfig.TC_DOMAIN}`,
        [],
    )

    const formatCurrency = useCallback((amount: number | string, currency?: string): string => {
        const n = typeof amount === 'number' ? amount : Number(amount)
        if (Number.isNaN(n)) return String(amount)
        const nf = new Intl.NumberFormat('en-US', {
            currency: currency || 'USD',
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
            style: 'currency',
        })
        return nf.format(n)
    }, [])

    useEffect(() => {
        const run = async (): Promise<void> => {
            const isPast = (props.variant ?? 'active') === 'past'
            if (!isPast || isTopgearTask) return
            if (!challengeId || !loginUserInfo?.userId) return
            setIsLoadingPayment(true)
            setHasPayment(false)
            setPaymentAmount(undefined)

            try {
                const winnings: WinningDetailDto[] = await fetchWinningsByExternalId(challengeId)
                const userIdStr = String(loginUserInfo.userId)
                const myWinnings = winnings.filter(w => String(w.winnerId) === userIdStr)

                if (!myWinnings.length) {
                    setHasPayment(false)
                    setPaymentAmount(undefined)
                    return
                }

                // Sum all detail amounts for this user
                let total = 0
                let currency: string | undefined
                myWinnings.forEach(w => {
                    w.details?.forEach(d => {
                        const val = Number(d.totalAmount)
                        if (!Number.isNaN(val)) {
                            total += val
                        }

                        // Prefer the first encountered currency
                        if (!currency && d.currency) {
                            currency = d.currency
                        }
                    })
                })

                if (total > 0) {
                    const pretty = formatCurrency(total, currency || 'USD')
                    setPaymentAmount(pretty)
                    setHasPayment(true)
                } else {
                    setHasPayment(false)
                    setPaymentAmount(undefined)
                }
            } catch (err) {
                // swallow and don't show payment cell on errors
                setHasPayment(false)
                setPaymentAmount(undefined)
            } finally {
                setIsLoadingPayment(false)
            }
        }

        run()
    }, [challengeId, loginUserInfo?.userId, props.variant, isTopgearTask, formatCurrency])
    const uiItems = useMemo(() => {
        const data = props.challengeInfo
        const variant = props.variant ?? 'active'

        const getChallengeEndDateValue = (): string => {
            if (data.endDateString) {
                return data.endDateString
            }

            if (data.endDate instanceof Date) {
                return data.endDate.toLocaleString()
            }

            if (typeof data.endDate === 'string') {
                return data.endDate
            }

            return 'N/A'
        }

        const items: any[] = []

        if (variant === 'active') {
            items.push({
                icon: 'icon-review',
                title: 'Phase',
                value: data.currentPhase || 'N/A',
            })
        }

        items.push({
            icon: 'icon-handle',
            title: 'My Role',
            value: (
                <div className={styles.blockMyRoles}>
                    {myChallengeRoles.map(item => (
                        <span key={item}>{item}</span>
                    ))}
                </div>
            ),
        })

        items.push({
            icon: 'icon-event',
            title: variant === 'past' ? 'Challenge End Date' : 'Phase End Date',
            value: variant === 'past'
                ? getChallengeEndDateValue()
                : data.currentPhaseEndDateString || '-',
        })

        if (variant === 'past' && hasPayment && paymentAmount && !isLoadingPayment && !isTopgearTask) {
            items.push({
                icon: 'icon-dollar',
                title: 'Payment',
                value: (
                    <a
                        href={walletUrl}
                        target='_blank'
                        rel='noreferrer noopener'
                    >
                        {paymentAmount}
                    </a>
                ),
            })
        }

        if (variant === 'active') {
            items.push({
                icon: 'icon-timer',
                status: data.timeLeftStatus,
                style: {
                    color: data.timeLeftColor,
                },
                title: 'Time Left',
                value: data.timeLeft || '-',
            })

            items.push({
                title: 'Review Progress',
                type: PROGRESS_TYPE,
                value: props.reviewProgress,
            })
        }

        return items
    }, [
        myChallengeRoles,
        props.challengeInfo,
        props.reviewProgress,
        props.variant,
        hasPayment,
        paymentAmount,
        isLoadingPayment,
        isTopgearTask,
        walletUrl,
    ])
    return (
        <div className={classNames(styles.container, props.className)}>
            {uiItems.map(item => {
                if (item.type === PROGRESS_TYPE) {
                    return (
                        <div
                            className={classNames(
                                styles.progress,
                                styles.blockItem,
                            )}
                            key={item.title}
                        >
                            <ProgressBar
                                progress={item.value}
                                withoutPercentage
                                progressWidth='160px'
                            />
                            <div className={styles.progressText}>
                                <span>Review Progress</span>
                                <strong>
                                    {item.value}
                                    %
                                </strong>
                            </div>
                        </div>
                    )
                }

                return (
                    <div className={styles.blockItem} key={item.title}>
                        <span className={styles.circleWrapper}>
                            <i className={item.icon} />
                        </span>
                        <div>
                            <span>{item.title}</span>
                            <strong
                                style={item.style}
                                className={styles.textInfo}
                            >
                                {item.status && (
                                    <i className={`icon-${item.status}`} />
                                )}
                                {item.value}
                            </strong>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ChallengePhaseInfo
