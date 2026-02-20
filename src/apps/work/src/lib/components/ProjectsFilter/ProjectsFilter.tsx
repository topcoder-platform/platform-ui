import {
    ChangeEvent,
    FC,
    FocusEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import {
    Button,
    InputCheckbox,
    InputSelectOption,
    InputSelectReact,
    InputText,
} from '~/libs/ui'

import { PROJECT_STATUSES } from '../../constants'
import { useFetchBillingAccounts } from '../../hooks'
import type { UseFetchBillingAccountsResult } from '../../hooks'
import {
    Project,
    ProjectFilters,
} from '../../models'

import styles from './ProjectsFilter.module.scss'

interface ProjectsFilterProps {
    filters: ProjectFilters
    onFiltersChange: (newFilters: ProjectFilters) => void
    isManager: boolean
    projects: Project[]
}

function normalizeBillingAccountId(value: number | string | undefined): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

export const ProjectsFilter: FC<ProjectsFilterProps> = (props: ProjectsFilterProps) => {
    const filters: ProjectFilters = props.filters
    const isManager: boolean = props.isManager
    const onFiltersChange: (newFilters: ProjectFilters) => void = props.onFiltersChange
    const projects: Project[] = props.projects
    const {
        billingAccounts,
    }: UseFetchBillingAccountsResult = useFetchBillingAccounts()

    const [keywordInput, setKeywordInput] = useState<string>(filters.keyword || '')
    const isFirstDebouncedRender = useRef<boolean>(true)

    useEffect(() => {
        setKeywordInput(filters.keyword || '')
    }, [filters.keyword])

    useEffect(() => {
        let timeout: number | undefined

        if (isFirstDebouncedRender.current) {
            isFirstDebouncedRender.current = false
        } else {
            timeout = window.setTimeout(() => {
                if ((filters.keyword || '') !== keywordInput) {
                    onFiltersChange({
                        ...filters,
                        keyword: keywordInput || undefined,
                    })
                }
            }, 350)
        }

        return () => {
            if (timeout) {
                window.clearTimeout(timeout)
            }
        }
    }, [filters, keywordInput, onFiltersChange])

    const statusOptions = useMemo<InputSelectOption[]>(
        () => [
            {
                label: 'All statuses',
                value: '',
            },
            ...PROJECT_STATUSES,
        ],
        [],
    )

    const selectedStatus = Array.isArray(filters.status)
        ? (filters.status[0] || '')
        : (filters.status || '')
    const selectedBillingAccountId = filters.billingAccountId || ''

    const billingAccountNames: Map<string, string> = useMemo<Map<string, string>>(
        () => new Map(
            billingAccounts.map(account => ([
                String(account.id),
                account.name,
            ])),
        ),
        [billingAccounts],
    )
    const projectBillingAccountNames: Map<string, string> = useMemo<Map<string, string>>(
        () => {
            const names = new Map<string, string>()

            projects.forEach(project => {
                const billingAccountId = normalizeBillingAccountId(project.billingAccountId)
                const billingAccountName = (project.billingAccountName || '').trim()

                if (billingAccountId && billingAccountName) {
                    names.set(billingAccountId, billingAccountName)
                }
            })

            return names
        },
        [projects],
    )

    const billingAccountOptions = useMemo<InputSelectOption[]>(
        () => {
            const billingAccountIds = new Set<string>()

            projects.forEach(project => {
                const billingAccountId = normalizeBillingAccountId(project.billingAccountId)

                if (billingAccountId) {
                    billingAccountIds.add(billingAccountId)
                }
            })

            if (selectedBillingAccountId) {
                billingAccountIds.add(selectedBillingAccountId)
            }

            const options = Array.from(billingAccountIds)
                .map(billingAccountId => ({
                    billingAccountId,
                    billingAccountName:
                        projectBillingAccountNames.get(billingAccountId)
                        || billingAccountNames.get(billingAccountId)
                        || 'Unknown',
                }))
                .sort((accountA, accountB) => {
                    const nameComparison = accountA.billingAccountName
                        .localeCompare(accountB.billingAccountName)

                    if (nameComparison !== 0) {
                        return nameComparison
                    }

                    return accountA.billingAccountId.localeCompare(accountB.billingAccountId)
                })
                .map(account => ({
                    label: `${account.billingAccountName} / ${account.billingAccountId}`,
                    value: account.billingAccountId,
                }))

            return [
                {
                    label: 'All billing accounts',
                    value: '',
                },
                ...options,
            ]
        },
        [billingAccountNames, projectBillingAccountNames, projects, selectedBillingAccountId],
    )

    function updateFilters(partial: Partial<ProjectFilters>): void {
        onFiltersChange({
            ...filters,
            ...partial,
        })
    }

    function handleKeywordInputChange(event: FocusEvent<HTMLInputElement>): void {
        setKeywordInput(event.target.value)
    }

    function handleStatusChange(event: ChangeEvent<HTMLInputElement>): void {
        const selectedStatusValue = event.target.value
        const normalizedStatus = PROJECT_STATUSES.some(item => item.value === selectedStatusValue)
            ? selectedStatusValue as ProjectFilters['status']
            : undefined

        updateFilters({
            status: normalizedStatus,
        })
    }

    function handleBillingAccountChange(event: ChangeEvent<HTMLInputElement>): void {
        const billingAccountId = event.target.value.trim()

        updateFilters({
            billingAccountId: billingAccountId || undefined,
        })
    }

    const noopCheckboxChange = (() => undefined) as (event: Event) => void

    function handleOnlyMyProjectsToggle(): void {
        updateFilters({
            memberOnly: !filters.memberOnly,
        })
    }

    function handleClearFilters(): void {
        setKeywordInput('')
        onFiltersChange({
            billingAccountId: undefined,
            keyword: undefined,
            memberOnly: undefined,
            status: undefined,
        })
    }

    return (
        <div className={classNames(styles.container, {
            [styles.managerContainer]: isManager,
        })}
        >
            <div className={styles.filterField}>
                <InputText
                    name='project-keyword'
                    type='text'
                    label='Search'
                    placeholder='Keyword'
                    value={keywordInput}
                    forceUpdateValue
                    onChange={handleKeywordInputChange}
                    classNameWrapper={styles.inputWrapper}
                />
            </div>

            <div className={styles.filterField}>
                <InputSelectReact
                    classNameWrapper={styles.inputWrapper}
                    name='project-status'
                    label='Project status'
                    value={selectedStatus}
                    options={statusOptions}
                    placeholder='All statuses'
                    onChange={handleStatusChange}
                    isClearable
                />
            </div>

            <div className={styles.filterField}>
                <InputSelectReact
                    classNameWrapper={styles.inputWrapper}
                    isClearable
                    label='Billing Account'
                    name='project-billing-account'
                    onChange={handleBillingAccountChange}
                    options={billingAccountOptions}
                    placeholder='All billing accounts'
                    value={selectedBillingAccountId}
                />
            </div>

            <div className={styles.actions}>
                <Button
                    secondary
                    size='lg'
                    label='Clear Filters'
                    onClick={handleClearFilters}
                />
            </div>

            {isManager ? (
                <div className={classNames(styles.filterField, styles.bottomAlignedField)}>
                    <div className={styles.checkboxWrap}>
                        <InputCheckbox
                            checked={!!filters.memberOnly}
                            name='project-member-only'
                            label='Only My Projects'
                            onChange={noopCheckboxChange}
                            onClick={handleOnlyMyProjectsToggle}
                        />
                    </div>
                </div>
            ) : undefined}
        </div>
    )
}

export default ProjectsFilter
