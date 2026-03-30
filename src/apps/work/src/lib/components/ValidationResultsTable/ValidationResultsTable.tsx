import {
    FC,
    useMemo,
} from 'react'

import { MemberValidationResult } from '../../models'

import styles from './ValidationResultsTable.module.scss'

interface ValidationResultsTableProps {
    results: MemberValidationResult[]
}

interface ValidationResultRow {
    key: string
    result: MemberValidationResult
}

function isMatched(result: MemberValidationResult): boolean {
    if (typeof result.match === 'boolean') {
        return result.match
    }

    if (typeof result.matched === 'boolean') {
        return result.matched
    }

    return !!result.userId
}

function sortValidationResults(results: MemberValidationResult[]): MemberValidationResult[] {
    return [...results].sort((resultA, resultB) => {
        const resultAMatch = isMatched(resultA) ? 1 : 0
        const resultBMatch = isMatched(resultB) ? 1 : 0

        if (resultAMatch !== resultBMatch) {
            return resultBMatch - resultAMatch
        }

        return resultA.input.localeCompare(resultB.input)
    })
}

function buildValidationRows(results: MemberValidationResult[]): ValidationResultRow[] {
    const rowKeyCounts = new Map<string, number>()

    return results.map(result => {
        const status = isMatched(result)
            ? 'matched'
            : 'not-matched'
        const userId = result.userId || 'not-found'
        const baseKey = `${result.input}-${userId}-${status}`
        const existingCount = rowKeyCounts.get(baseKey) || 0
        const nextCount = existingCount + 1

        rowKeyCounts.set(baseKey, nextCount)

        return {
            key: `${baseKey}-${nextCount}`,
            result,
        }
    })
}

export const ValidationResultsTable: FC<ValidationResultsTableProps> = (
    props: ValidationResultsTableProps,
) => {
    const sortedResults = useMemo(
        () => sortValidationResults(props.results),
        [props.results],
    )

    const matchedCount = useMemo(
        () => sortedResults.filter(result => isMatched(result)).length,
        [sortedResults],
    )
    const rows = useMemo(
        () => buildValidationRows(sortedResults),
        [sortedResults],
    )

    const totalCount = rows.length
    const unmatchedCount = totalCount - matchedCount

    if (!totalCount) {
        return <div className={styles.emptyState}>No validation results yet.</div>
    }

    return (
        <div className={styles.container}>
            <div className={styles.summary}>
                Validation Results:
                {' '}
                <span className={styles.matchedCount}>
                    {matchedCount}
                    {' '}
                    matched
                </span>
                ,
                {' '}
                <span className={styles.unmatchedCount}>
                    {unmatchedCount}
                    {' '}
                    not matched
                </span>
                {' '}
                out of
                {' '}
                {totalCount}
                {' '}
                total
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope='col'>Input</th>
                            <th scope='col'>User ID</th>
                            <th scope='col'>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const result = row.result
                            const matched = isMatched(result)
                            const statusText = matched
                                ? '\u2713 Matched'
                                : '\u2717 Not Found'

                            return (
                                <tr key={row.key}>
                                    <td>{result.input}</td>
                                    <td>{result.userId || 'Not Found'}</td>
                                    <td className={matched ? styles.statusMatched : styles.statusNotMatched}>
                                        {statusText}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ValidationResultsTable
