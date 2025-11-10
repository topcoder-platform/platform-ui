/**
 * Challenge Phase Info.
 */
import type { FC, ReactNode } from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'

import type { BackendPhase, BackendResource, ChallengeInfo, ReviewAppContextModel } from '../../models'
import type { WinningDetailDto } from '../../services'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { useRole, useRoleProps } from '../../hooks'
import { fetchWinningsByExternalId } from '../../services'
import { ProgressBar } from '../ProgressBar'
import { SUBMITTER, TABLE_DATE_FORMAT } from '../../../config/index.config'
import { formatDurationDate } from '../../utils'

import styles from './ChallengePhaseInfo.module.scss'

const PROGRESS_TYPE = 'progress' as const

interface Props {
    className?: string
    challengeInfo: ChallengeInfo
    reviewProgress: number
    reviewInProgress: boolean
    variant?: 'active' | 'past'
}

interface ChallengePhaseDisplayItem {
    icon?: string
    status?: string
    style?: Record<string, unknown>
    title: string
    type?: undefined
    value: ReactNode
}

interface ChallengePhaseProgressItem {
    title: string
    type: typeof PROGRESS_TYPE
    value: number
}

type ChallengePhaseItem = ChallengePhaseDisplayItem | ChallengePhaseProgressItem

type ChallengeVariant = 'active' | 'past'

interface PhaseDisplayInfo {
    phaseEndDateString?: string
    phaseLabel: string
    timeLeft?: string
    timeLeftColor?: string
    timeLeftStatus?: string
}

export const ChallengePhaseInfo: FC<Props> = (props: Props) => {
    const { myChallengeRoles }: useRoleProps = useRole()
    const {
        challengeId,
        resources,
    }: { challengeId?: string; resources: BackendResource[] } = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const [paymentAmount, setPaymentAmount] = useState<string | undefined>(undefined)
    const [hasPayment, setHasPayment] = useState(false)
    const [isLoadingPayment, setIsLoadingPayment] = useState(false)

    const isTopgearTask = useMemo(() => {
        const t = (props.challengeInfo?.type?.name || '').toLowerCase()
        return t === 'topgear task'
    }, [props.challengeInfo?.type?.name])

    const isTask = useMemo(() => {
        const abbreviation = (props.challengeInfo?.type?.abbreviation || '').toUpperCase()
        const name = (props.challengeInfo?.type?.name || '').toLowerCase()
        return abbreviation === 'TSK' || name === 'task'
    }, [props.challengeInfo?.type?.abbreviation, props.challengeInfo?.type?.name])

    const submitterHandle = useMemo(() => {
        if (!Array.isArray(resources)) return 'N/A'

        const match = resources.find(resource => {
            const role = resource?.roleName?.toLowerCase() || ''
            return role.includes(SUBMITTER.toLowerCase())
        })

        return match?.memberHandle || 'N/A'
    }, [resources])

    const formattedStartDate = useMemo(() => {
        const startDate = props.challengeInfo?.startDate
        if (!startDate) return 'N/A'

        const m = moment(startDate)
        if (!m.isValid()) return 'N/A'

        return m
            .local()
            .format(TABLE_DATE_FORMAT)
    }, [props.challengeInfo?.startDate])

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

    const taskPaymentFromPrizeSets = useMemo(() => {
        if (!isTask) return undefined

        const prizeSets = props.challengeInfo?.prizeSets
        if (!Array.isArray(prizeSets)) return undefined

        const placementPrizeSet = prizeSets.find(prizeSet => prizeSet?.type === 'PLACEMENT')
        if (!placementPrizeSet || !Array.isArray(placementPrizeSet.prizes) || !placementPrizeSet.prizes.length) {
            return undefined
        }

        const [firstPrize] = placementPrizeSet.prizes
        if (typeof firstPrize?.value !== 'number' || typeof firstPrize?.type !== 'string') {
            return undefined
        }

        return {
            currency: firstPrize.type,
            value: firstPrize.value,
        }
    }, [isTask, props.challengeInfo?.prizeSets])

    const formattedTaskPayment = useMemo(() => {
        if (!taskPaymentFromPrizeSets) return undefined
        return formatCurrency(taskPaymentFromPrizeSets.value, taskPaymentFromPrizeSets.currency)
    }, [taskPaymentFromPrizeSets, formatCurrency])

    const walletUrl = useMemo(
        () => `https://wallet.${EnvironmentConfig.TC_DOMAIN}`,
        [],
    )

    const formattedNonTaskPayment = useMemo(() => {
        const variant = props.variant ?? 'active'
        if (!shouldShowPayment(
            variant,
            hasPayment,
            Boolean(paymentAmount),
            isLoadingPayment,
            isTopgearTask,
        )) {
            return undefined
        }

        return paymentAmount
    }, [
        props.variant,
        hasPayment,
        paymentAmount,
        isLoadingPayment,
        isTopgearTask,
    ])
    const {
        phaseEndDateString: displayPhaseEndDateString,
        phaseLabel: displayPhaseLabel,
        timeLeft: displayTimeLeft,
        timeLeftColor: displayTimeLeftColor,
        timeLeftStatus: displayTimeLeftStatus,
    }: PhaseDisplayInfo = useMemo(
        () => computePhaseDisplayInfo(props.challengeInfo),
        [props.challengeInfo],
    )

    useEffect(() => {
        const run = async (): Promise<void> => {
            const isPast = (props.variant ?? 'active') === 'past'
            if (isTask || (!isPast && !isTopgearTask)) return
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
    }, [challengeId, loginUserInfo?.userId, props.variant, isTopgearTask, isTask, formatCurrency])
    const uiItems = useMemo(() => {
        const data = props.challengeInfo
        const variant: ChallengeVariant = props.variant ?? 'active'
        const reviewInProgress = props.reviewInProgress

        return [
            ...createPhaseItems({
                displayPhaseLabel,
                isTask,
                variant,
            }),
            createRolesItem(myChallengeRoles),
            ...createTaskItems({
                formattedStartDate,
                formattedTaskPayment,
                isTask,
                submitterHandle,
                walletUrl,
            }),
            ...createNonTaskItems({
                data,
                displayPhaseEndDateString,
                formattedNonTaskPayment,
                isTask,
                variant,
                walletUrl,
            }),
            ...createActiveItems({
                data,
                displayTimeLeft,
                displayTimeLeftColor,
                displayTimeLeftStatus,
                isTask,
                progressType: PROGRESS_TYPE,
                reviewInProgress,
                reviewProgress: props.reviewProgress,
                variant,
            }),
        ]
    }, [
        formattedNonTaskPayment,
        formattedStartDate,
        formattedTaskPayment,
        isTask,
        myChallengeRoles,
        props.challengeInfo,
        displayPhaseLabel,
        displayPhaseEndDateString,
        displayTimeLeft,
        displayTimeLeftColor,
        displayTimeLeftStatus,
        props.reviewProgress,
        props.reviewInProgress,
        props.variant,
        submitterHandle,
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

function createPhaseItems(config: {
    displayPhaseLabel: string
    isTask: boolean
    variant: ChallengeVariant
}): ChallengePhaseItem[] {
    if (config.variant !== 'active') {
        return []
    }

    if (config.isTask) {
        return []
    }

    return [{
        icon: 'icon-review',
        title: 'Phase',
        value: config.displayPhaseLabel || 'N/A',
    }]
}

function createRolesItem(myChallengeRoles: string[]): ChallengePhaseItem {
    return {
        icon: 'icon-handle',
        title: 'My Role',
        value: (
            <div className={styles.blockMyRoles}>
                {myChallengeRoles.map(item => (
                    <span key={item}>{item}</span>
                ))}
            </div>
        ),
    }
}

function createTaskItems(config: {
    formattedStartDate: string
    formattedTaskPayment?: string
    isTask: boolean
    submitterHandle: string
    walletUrl: string
}): ChallengePhaseItem[] {
    if (!config.isTask) {
        return []
    }

    const items: ChallengePhaseItem[] = [{
        icon: 'icon-handle',
        title: 'Assignee',
        value: config.submitterHandle,
    }, {
        icon: 'icon-event',
        title: 'Create Date',
        value: config.formattedStartDate,
    }]

    if (config.formattedTaskPayment) {
        items.push({
            icon: 'icon-dollar',
            title: 'Payment',
            value: (
                <a
                    href={config.walletUrl}
                    target='_blank'
                    rel='noreferrer noopener'
                >
                    {config.formattedTaskPayment}
                </a>
            ),
        })
    }

    return items
}

function createNonTaskItems(config: {
    data: ChallengeInfo
    formattedNonTaskPayment?: string
    isTask: boolean
    displayPhaseEndDateString?: string
    variant: ChallengeVariant
    walletUrl: string
}): ChallengePhaseItem[] {
    if (config.isTask) {
        return []
    }

    const items: ChallengePhaseItem[] = [{
        icon: 'icon-event',
        title: config.variant === 'past' ? 'Challenge End Date' : 'Phase End Date',
        value: config.variant === 'past'
            ? getChallengeEndDateValue(config.data)
            : config.displayPhaseEndDateString || '-',
    }]

    if (config.formattedNonTaskPayment) {
        items.push({
            icon: 'icon-dollar',
            title: 'Payment',
            value: (
                <a
                    href={config.walletUrl}
                    target='_blank'
                    rel='noreferrer noopener'
                >
                    {config.formattedNonTaskPayment}
                </a>
            ),
        })
    }

    return items
}

function createActiveItems(config: {
    data: ChallengeInfo
    displayTimeLeft?: string
    displayTimeLeftColor?: string
    displayTimeLeftStatus?: string
    progressType: typeof PROGRESS_TYPE
    reviewInProgress: boolean
    reviewProgress: number
    variant: ChallengeVariant
    isTask: boolean
}): ChallengePhaseItem[] {
    if (config.variant !== 'active') {
        return []
    }

    if (config.isTask) {
        return []
    }

    const items: ChallengePhaseItem[] = [{
        icon: 'icon-timer',
        status: config.displayTimeLeftStatus,
        style: {
            color: config.displayTimeLeftColor,
        },
        title: 'Time Left',
        value: config.displayTimeLeft || '-',
    }]

    if (!config.reviewInProgress) {
        items.push({
            title: 'Review Progress',
            type: config.progressType,
            value: config.reviewProgress,
        })
    }

    return items
}

function computePhaseDisplayInfo(data?: ChallengeInfo): PhaseDisplayInfo {
    const fallbackPhaseLabel = (data?.currentPhase || '').trim() || 'N/A'
    const fallback: PhaseDisplayInfo = {
        phaseEndDateString: data?.currentPhaseEndDateString,
        phaseLabel: fallbackPhaseLabel,
        timeLeft: data?.timeLeft,
        timeLeftColor: data?.timeLeftColor,
        timeLeftStatus: data?.timeLeftStatus,
    }

    if (!data) {
        return fallback
    }

    const phaseForDisplay = selectPhaseForDisplay(data)
    const phaseLabel = computeDisplayPhaseLabel(data, phaseForDisplay) || fallback.phaseLabel
    const timing = computePhaseTiming(phaseForDisplay)

    return {
        phaseEndDateString: timing.endDateString ?? fallback.phaseEndDateString,
        phaseLabel,
        timeLeft: timing.timeLeft ?? fallback.timeLeft,
        timeLeftColor: timing.timeLeftColor ?? fallback.timeLeftColor,
        timeLeftStatus: timing.timeLeftStatus ?? fallback.timeLeftStatus,
    }
}

function selectPhaseForDisplay(data?: ChallengeInfo): BackendPhase | undefined {
    if (!data) return undefined

    const phases = Array.isArray(data.phases) ? data.phases : []
    if (!phases.length) {
        return data.currentPhaseObject
    }

    const openPhases = phases.filter(phase => phase?.isOpen)
    if (!openPhases.length) {
        return data.currentPhaseObject
    }

    const submissionPhase = openPhases.find(phase => normalizePhaseName(phase?.name) === 'submission')
    const registrationPhase = openPhases.find(phase => normalizePhaseName(phase?.name) === 'registration')

    if (submissionPhase && registrationPhase) {
        return submissionPhase
    }

    if (data.currentPhaseObject && data.currentPhaseObject.isOpen) {
        return data.currentPhaseObject
    }

    return submissionPhase ?? openPhases[0]
}

function computeDisplayPhaseLabel(
    data?: ChallengeInfo,
    phase?: BackendPhase,
): string {
    const fallback = (data?.currentPhase || '').trim() || 'N/A'

    if (!data) {
        return fallback
    }

    if (phase && isIterativePhaseName(phase.name)) {
        const iterativeLabel = computeIterativeReviewLabel(data, phase)
        if (iterativeLabel) {
            return iterativeLabel
        }
    } else if (!phase) {
        const iterativeLabel = computeIterativeReviewLabel(data)
        if (iterativeLabel) {
            return iterativeLabel
        }
    }

    const name = (phase?.name || '').trim()
    if (name) {
        return name
    }

    return fallback
}

function computePhaseTiming(phase?: BackendPhase): {
    endDateString?: string
    timeLeft?: string
    timeLeftColor?: string
    timeLeftStatus?: string
} {
    if (!phase || !phase.isOpen) {
        return {}
    }

    const rawEndDate = phase.actualEndDate || phase.scheduledEndDate
    if (!rawEndDate) {
        return {}
    }

    const endDate = new Date(rawEndDate)
    if (Number.isNaN(endDate.getTime())) {
        return {}
    }

    const formattedEndDate = moment(endDate)
        .local()
        .format(TABLE_DATE_FORMAT)
    const duration = formatDurationDate(endDate, new Date())

    return {
        endDateString: formattedEndDate,
        timeLeft: duration.durationString,
        timeLeftColor: duration.durationColor,
        timeLeftStatus: duration.durationStatus,
    }
}

function normalizePhaseName(name?: string): string {
    return (name || '')
        .toString()
        .trim()
        .toLowerCase()
}

// Helpers extracted to keep component complexity manageable
function isIterativePhaseName(name?: string): boolean {
    return typeof name === 'string' && name.trim()
        .toLowerCase()
        .includes('iterative review')
}

function computeIterativeReviewLabel(
    data: any,
    overridePhase?: BackendPhase,
): string | undefined {
    const phases = Array.isArray(data?.phases) ? data.phases : []

    const current = overridePhase ?? data?.currentPhaseObject
    const currentIsIterative = isIterativePhaseName(current?.name)

    const openIterative = currentIsIterative
        ? current
        : phases.find((p: any) => p.isOpen && isIterativePhaseName(p.name))

    if (!openIterative || !isIterativePhaseName(openIterative.name)) {
        return undefined
    }

    const iterativePhases = phases
        .filter((p: any) => isIterativePhaseName(p.name))
        .slice()
        .sort((a: any, b: any) => {
            const aStart = new Date(a.actualStartDate || a.scheduledStartDate || '')
                .getTime()
            const bStart = new Date(b.actualStartDate || b.scheduledStartDate || '')
                .getTime()

            if (!Number.isNaN(aStart) && !Number.isNaN(bStart) && aStart !== bStart) {
                return aStart - bStart
            }

            return 0
        })

    const idx = iterativePhases.findIndex((p: any) => p.id === openIterative.id)
    const number = idx >= 0 ? idx + 1 : undefined
    if (!number) return undefined
    return `Iterative Review ${number}`
}

function getChallengeEndDateValue(data: any): string {
    if (data?.endDateString) {
        return data.endDateString
    }

    if (data?.endDate instanceof Date) {
        return data.endDate.toLocaleString()
    }

    if (typeof data?.endDate === 'string') {
        return data.endDate
    }

    return 'N/A'
}

function shouldShowPayment(
    variant: string,
    hasPayment: boolean,
    hasPaymentAmount: boolean,
    isLoadingPayment: boolean,
    isTopgearTask: boolean,
): boolean {
    return (
        variant === 'past'
        && hasPayment
        && hasPaymentAmount
        && !isLoadingPayment
        && !isTopgearTask
    )
}
