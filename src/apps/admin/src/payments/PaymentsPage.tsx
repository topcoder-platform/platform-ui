import { type ChangeEvent, FC, type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { startCase, toLower, toUpper, trim } from 'lodash'
import classNames from 'classnames'

import { BaseModal, Button, InputSelect, InputSelectOption, InputText, LoadingSpinner, PageTitle } from '~/libs/ui'

import { PageContent, PageHeader } from '../lib'
import { FieldHandleSelect } from '../lib/components/FieldHandleSelect'
import { SelectOption } from '../lib/models/SelectOption.model'
import { handleError } from '../lib/utils/api'
import { getChallengeById, searchChallenges } from '../lib/services/challenge-management.service'
import type { Challenge } from '../lib/models/challenge-management/Challenge'
import type { ChallengeFilterCriteria } from '../lib/models/challenge-management/ChallengeFilterCriteria'
import {
    createWinning,
    getChallengePayments,
    getMembersByIds,
    type PaymentWinning,
    toReadableCategory,
    WinningsCategories,
    WinningsTypeOptions,
} from '../lib/services/payments.service'

import styles from './PaymentsPage.module.scss'

const pageTitle = 'Payments'

export const PaymentsPage: FC = () => {
    // Search state
    const [name, setName] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [searched, setSearched] = useState(false)
    const [results, setResults] = useState<Challenge[]>([])

    // Selected challenge and payments
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | undefined>(undefined)
    const [isLoadingPayments, setIsLoadingPayments] = useState(false)
    const [payments, setPayments] = useState<PaymentWinning[]>([])
    const [winnerHandleMap, setWinnerHandleMap] = useState<Record<string, string>>({})

    const [showModal, setShowModal] = useState(false)
    const [selectedMember, setSelectedMember] = useState<SelectOption | undefined>(undefined)
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<'PAYMENT' | 'REWARD'>('PAYMENT')
    const [category, setCategory] = useState<string>('CONTEST_PAYMENT')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const categoryOptions: InputSelectOption[] = useMemo(
        () => WinningsCategories
            .map(value => ({ label: toReadableCategory(value), value }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })),
        [],
    )

    const handleSearch = useCallback(async () => {
        setIsSearching(true)
        setSearched(false)
        try {
            const filter: ChallengeFilterCriteria = {
                name: name.trim(),
                page: 1,
                perPage: 20,
            } as any
            const result = await searchChallenges(filter)
            setResults(result.data)
            setSearched(true)
        } catch (err: any) {
            handleError(err)
        } finally {
            setIsSearching(false)
        }
    }, [name])

    const formatChallengeStatusLabel = useCallback((rawStatus?: string): string => {
        if (!rawStatus) return ''
        const normalized = toUpper(trim(rawStatus))

        if (normalized === 'COMPLETED') return 'Completed'
        if (normalized === 'CANCELLED') return 'Cancelled'
        if (normalized.startsWith('CANCELLED_')) {
            const reason = normalized.slice('CANCELLED_'.length)
            const prettyReason = startCase(toLower(reason))
            return `Cancelled: ${prettyReason}`
        }

        return startCase(toLower(normalized))
    }, [])

    const refreshPayments = useCallback(async (challengeId: string) => {
        setIsLoadingPayments(true)
        try {
            const data = await getChallengePayments(challengeId)
            const list: PaymentWinning[] = data.winnings || []
            setPayments(list)
            const uniqueWinnerIds: string[] = Array.from(
                new Set(
                    list.map((i: PaymentWinning) => String(i.winnerId)),
                ),
            )
            if (uniqueWinnerIds.length) {
                const members = await getMembersByIds(uniqueWinnerIds)
                const map: Record<string, string> = {}
                members.forEach(m => { map[String(m.userId)] = m.handle })
                setWinnerHandleMap(map)
            } else {
                setWinnerHandleMap({})
            }
        } catch (err: any) {
            handleError(err)
        } finally {
            setIsLoadingPayments(false)
        }
    }, [])

    useEffect(() => {
        if (selectedChallenge?.id) {
            refreshPayments(selectedChallenge.id)
        }
    }, [selectedChallenge, refreshPayments])

    const openAddPayment = useCallback(() => {
        setSelectedMember(undefined)
        setAmount('')
        setType('PAYMENT')
        setCategory('CONTEST_PAYMENT')
        setTitle('')
        setDescription('')
        setShowModal(true)
    }, [])

    // Handlers to avoid inline arrow functions in JSX
    const handleNameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setName((e.target as any).value)
    }, [])

    const handleChallengeClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
        const id = (e.currentTarget.getAttribute('data-id') || '') as string
        if (!id) return
        const found = results.find(ch => ch.id === id)
        if (found) setSelectedChallenge(found)
    }, [results])

    const handleAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setAmount((e.target as any).value)
    }, [])

    const handleTypeChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setType((e.target as any).value)
    }, [])

    const handleCategoryChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setCategory((e.target as any).value)
    }, [])

    const handleTitleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setTitle((e.target as any).value)
    }, [])

    const handleDescriptionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        setDescription((e.target as any).value)
    }, [])

    const closeAddPayment = useCallback(() => setShowModal(false), [])

    const canSubmit = useMemo(() => (
        !!selectedChallenge
        && !!selectedMember?.value
        && !!amount
        && parseFloat(amount) >= 0
        && !!title
        && !!description
    ), [selectedChallenge, selectedMember, amount, title, description])

    const handleSubmit = useCallback(async () => {
        if (!selectedChallenge || !selectedMember?.value) return
        try {
            setIsSubmitting(true)

            // Try to read billing account from the selected challenge first
            let billingAccount: string | undefined
            const fromSelected = (selectedChallenge as any)?.billing?.billingAccountId
            if (fromSelected !== undefined && fromSelected !== null) {
                billingAccount = String(fromSelected)
            } else {
                // Fallback: fetch full challenge details to get billing info
                try {
                    const fullChallenge: any = await getChallengeById(selectedChallenge.id)
                    const fromDetails = fullChallenge?.billing?.billingAccountId
                    if (fromDetails !== undefined && fromDetails !== null) {
                        billingAccount = String(fromDetails)
                    }
                } catch (e) {
                    // Ignore here; will be handled by validation below
                }
            }

            if (!billingAccount) {
                throw new Error(
                    'No billing account found for this challenge. '
                    + 'Please ensure the challenge has a billing account set before creating a payment.',
                )
            }

            const payload = {
                attributes: {},
                category,
                description,
                details: [
                    {
                        billingAccount,
                        challengeFee: 0,
                        currency: 'USD',
                        grossAmount: Number(amount),
                        installmentNumber: 1,
                        totalAmount: Number(amount),
                    },
                ],
                externalId: selectedChallenge.id,
                origin: 'Topcoder',
                title,
                type,
                winnerId: String(selectedMember.value),
            }
            await createWinning(payload)
            setShowModal(false)
            await refreshPayments(selectedChallenge.id)
        } catch (err: any) {
            handleError(err)
        } finally {
            setIsSubmitting(false)
        }
    }, [selectedChallenge, selectedMember, type, category, title, description, amount, refreshPayments])

    return (
        <div className={classNames(styles.container)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>
            <PageContent>
                <div className={styles.searchBlock}>
                    <InputText
                        name='challengeSearch'
                        type='text'
                        label='Search Challenge by Name'
                        placeholder='Enter challenge name'
                        value={name}
                        onChange={handleNameChange}
                        forceUpdateValue
                        classNameWrapper={styles.searchInput}
                    />
                    <div className={styles.actions}>
                        <Button primary size='lg' onClick={handleSearch} disabled={!name.trim() || isSearching}>
                            Search
                        </Button>
                    </div>
                </div>

                {isSearching && (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                )}

                {!isSearching && searched && (
                    <div className={styles.results}>
                        {results.length === 0 ? (
                            <p className={styles.noRecordFound}>No challenges found</p>
                        ) : (
                            <div className={styles.list}>
                                {results.map(ch => (
                                    <div
                                        key={ch.id}
                                        className={classNames(
                                            styles.listItem,
                                            selectedChallenge?.id === ch.id && styles.active,
                                        )}
                                        data-id={ch.id}
                                        onClick={handleChallengeClick}
                                        role='button'
                                        tabIndex={0}
                                    >
                                        <div className={styles.title}>{ch.name}</div>
                                        <div className={styles.meta}>
                                            ID:
                                            {ch.id}
                                            {' '}
                                            • Status:
                                            {formatChallengeStatusLabel(ch.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedChallenge && (
                    <div className={styles.paymentsBlock}>
                        <div className={styles.paymentsHeader}>
                            <h4>
                                Payments for:
                                {selectedChallenge.name}
                            </h4>
                            <Button primary size='lg' onClick={openAddPayment}>
                                Add payment to this challenge
                            </Button>
                        </div>
                        {isLoadingPayments ? (
                            <div className={styles.loadingSpinnerContainer}>
                                <LoadingSpinner className={styles.spinner} />
                            </div>
                        ) : (
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Winner</th>
                                            <th>Type</th>
                                            <th>Category</th>
                                            <th>Title</th>
                                            <th>Description</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Currency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => {
                                            const first = p.details?.[0]
                                            const handle = winnerHandleMap[p.winnerId] || p.handle || p.winnerId
                                            return (
                                                <tr key={p.id}>
                                                    <td>{handle}</td>
                                                    <td>{p.type}</td>
                                                    <td>{p.category ? toReadableCategory(p.category) : ''}</td>
                                                    <td>{p.title || ''}</td>
                                                    <td>{p.description || ''}</td>
                                                    <td>{first ? first.totalAmount : ''}</td>
                                                    <td>{first ? first.status : ''}</td>
                                                    <td>{first ? first.currency : ''}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                                {payments.length === 0 && <p className={styles.noRecordFound}>No payments found</p>}
                            </div>
                        )}
                    </div>
                )}
            </PageContent>

            <BaseModal title='Add Payment' open={showModal} onClose={closeAddPayment}>
                <div className={styles.modalForm}>
                    <FieldHandleSelect
                        label='Member Handle'
                        placeholder='Start typing a handle'
                        value={selectedMember}
                        onChange={setSelectedMember}
                        disabled={isSubmitting}
                        isLoading={isSubmitting}
                    />
                    <InputText
                        name='amount'
                        label='Amount'
                        type='number'
                        value={amount}
                        onChange={handleAmountChange}
                        disabled={isSubmitting}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <InputSelect
                        name='type'
                        label='Type'
                        options={WinningsTypeOptions as unknown as InputSelectOption[]}
                        value={type}
                        onChange={handleTypeChange}
                        disabled={isSubmitting}
                        tabIndex={0}
                    />
                    <InputSelect
                        name='category'
                        label='Category'
                        options={categoryOptions}
                        value={category}
                        onChange={handleCategoryChange}
                        disabled={isSubmitting}
                        tabIndex={0}
                    />
                    <InputText
                        name='title'
                        label='Title'
                        type='text'
                        value={title}
                        onChange={handleTitleChange}
                        disabled={isSubmitting}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <InputText
                        name='description'
                        label='Description'
                        type='text'
                        value={description}
                        onChange={handleDescriptionChange}
                        disabled={isSubmitting}
                        tabIndex={0}
                        forceUpdateValue
                    />
                    <div className={styles.modalActions}>
                        <Button secondary size='lg' onClick={closeAddPayment} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button primary size='lg' onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
                            Create Payment
                        </Button>
                    </div>
                    {isSubmitting && (
                        <div className={styles.blockActionLoading}>
                            <LoadingSpinner className={styles.spinner} />
                        </div>
                    )}
                </div>
            </BaseModal>
        </div>
    )
}

export default PaymentsPage
