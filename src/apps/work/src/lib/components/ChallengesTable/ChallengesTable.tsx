import { FC, MouseEvent } from 'react'
import { Link } from 'react-router-dom'

import {
    Button,
    LoadingSpinner,
} from '~/libs/ui'

import {
    Challenge,
    ChallengeType,
} from '../../models'
import { ChallengeCard } from '../ChallengeCard'

import styles from './ChallengesTable.module.scss'

type SortOrder = 'asc' | 'desc'

interface ChallengesTableProps {
    challenges: Challenge[]
    challengeTypes: ChallengeType[]
    createChallengePath?: string
    isLoading?: boolean
    showCreateButton?: boolean
    sortBy: string
    sortOrder: SortOrder
    onSort: (fieldName: string) => void
    onChallengeClick?: (challenge: Challenge) => void
}

interface ColumnDefinition {
    label: string
    fieldName?: string
    sortable?: boolean
}

const columns: ColumnDefinition[] = [
    {
        label: 'Type',
    },
    {
        fieldName: 'name',
        label: 'Challenge Name',
        sortable: true,
    },
    {
        fieldName: 'startDate',
        label: 'Start Date',
        sortable: true,
    },
    {
        fieldName: 'endDate',
        label: 'End Date',
        sortable: true,
    },
    {
        fieldName: 'numOfRegistrants',
        label: 'Registrants',
        sortable: true,
    },
    {
        fieldName: 'numOfSubmissions',
        label: 'Submissions',
        sortable: true,
    },
    {
        fieldName: 'status',
        label: 'Status',
        sortable: true,
    },
    {
        label: 'Phase',
    },
    {
        label: 'Actions',
    },
]

function getSortIndicator(
    currentSortBy: string,
    currentSortOrder: SortOrder,
    fieldName?: string,
): string {
    if (!fieldName || fieldName !== currentSortBy) {
        return ''
    }

    return currentSortOrder === 'asc'
        ? ' \u2191'
        : ' \u2193'
}

export const ChallengesTable: FC<ChallengesTableProps> = (props: ChallengesTableProps) => {
    const challengeTypes: ChallengeType[] = props.challengeTypes
    const challenges: Challenge[] = props.challenges
    const createChallengePath = props.createChallengePath || '/challenges/new'
    const isLoading: boolean = !!props.isLoading
    const onChallengeClick: ((challenge: Challenge) => void) | undefined = props.onChallengeClick
    const onSort: (fieldName: string) => void = props.onSort
    const showCreateButton = !!props.showCreateButton
    const sortBy: string = props.sortBy
    const sortOrder: SortOrder = props.sortOrder

    function handleSortButtonClick(event: MouseEvent<HTMLButtonElement>): void {
        const fieldName = event.currentTarget.dataset.fieldName
        if (!fieldName) {
            return
        }

        onSort(fieldName)
    }

    return (
        <div className={styles.container}>
            {showCreateButton
                ? (
                    <div className={styles.headerActions}>
                        <Link to={createChallengePath} className={styles.createButtonLink}>
                            <Button
                                label='Create Challenge'
                                primary
                                size='lg'
                            />
                        </Link>
                    </div>
                )
                : undefined}
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th key={column.label}>
                                {column.sortable && column.fieldName ? (
                                    <button
                                        type='button'
                                        className={styles.sortButton}
                                        data-field-name={column.fieldName}
                                        onClick={handleSortButtonClick}
                                    >
                                        {column.label}
                                        {getSortIndicator(sortBy, sortOrder, column.fieldName)}
                                    </button>
                                ) : (
                                    <span>{column.label}</span>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {isLoading && (
                        <tr>
                            <td colSpan={columns.length} className={styles.loadingRow}>
                                <LoadingSpinner inline />
                            </td>
                        </tr>
                    )}

                    {!isLoading && challenges.length === 0 && (
                        <tr>
                            <td colSpan={columns.length} className={styles.emptyRow}>
                                No challenges found.
                            </td>
                        </tr>
                    )}

                    {!isLoading && challenges.map(challenge => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            challengeTypes={challengeTypes}
                            onChallengeClick={onChallengeClick}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default ChallengesTable
