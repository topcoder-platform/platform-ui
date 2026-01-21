/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React, { FC, useCallback, useEffect, useState } from 'react'

import { Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getPoints } from '../../../lib/services/wallet'
import { FilterBar } from '../../../lib'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import PointsTable from '../../../lib/components/points-table/PointsTable'

import styles from './Winnings.module.scss'
import { WinningDetail } from '../../../lib/models/WinningDetail'
import { formatCurrency } from './PaymentsListView'

interface PointsListViewProps {
    profile: UserProfile
    isCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

interface PointItem {
    amount: number
    createDate: string
    description: string
    id: string
}

function formatIOSDateString(iosDateString: string): string {
    const date = new Date(iosDateString)

    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date string')
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }

    return date.toLocaleDateString('en-GB', options)
}

const PointsListView: FC<PointsListViewProps> = (props: PointsListViewProps) => {
    const [hasPointsWinnings, setHasPointsWinnings] = useState<boolean>()
    const [pointsWinnings, setPointsWinnings] = React.useState<ReadonlyArray<PointItem>>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})

    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 3,
        totalItems: 0,
        totalPages: 0,
    })

    const convertToPoints = useCallback(
        (pointsData: WinningDetail[]) => pointsData.map((p) => ({
            amount: parseFloat(p.details[0].totalAmount),
            createDate: formatIOSDateString(p.createdAt),
            description: p.description,
            id: p.id,
        })),
        [],
    )

    const fetchPoints = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await getPoints(props.profile.userId.toString(), pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, filters)
            const pointsData = convertToPoints(response.winnings)
            setPointsWinnings(pointsData)
            setPagination(response.pagination)
        } catch (apiError) {
            console.error('Failed to fetch points:', apiError)
            // Set empty data on error
            setPointsWinnings([])
            setPagination({
                currentPage: 1,
                pageSize: pagination.pageSize,
                totalItems: 0,
                totalPages: 0,
            })
        } finally {
            setIsLoading(false)
        }
    }, [props.profile.userId, convertToPoints, filters, pagination.currentPage, pagination.pageSize])

    useEffect(() => {
        fetchPoints()
    }, [fetchPoints])

    useEffect(() => {
        if (isLoading || hasPointsWinnings !== undefined) {
            return
        }

        setHasPointsWinnings(pointsWinnings.length > 0)
    }, [isLoading, pointsWinnings])

    if (!hasPointsWinnings) {
        return <></>
    }

    return (
        <Collapsible
            header={<h3>Points</h3>}
            isCollapsed={props.isCollapsed}
            onToggle={props.onToggle}
        >
            <FilterBar
                filters={[
                    {
                        key: 'date',
                        label: 'Date',
                        options: [
                            {
                                label: 'Last 7 days',
                                value: 'last7days',
                            },
                            {
                                label: 'Last 30 days',
                                value: 'last30days',
                            },
                            {
                                label: 'All',
                                value: 'all',
                            },
                        ],
                        type: 'dropdown',
                    },
                    {
                        key: 'pageSize',
                        label: 'Points per page',
                        options: [
                            {
                                label: '10',
                                value: '10',
                            },
                            {
                                label: '50',
                                value: '50',
                            },
                            {
                                label: '100',
                                value: '100',
                            },
                        ],
                        type: 'dropdown',
                    },
                ]}
                onFilterChange={(key: string, value: string[]) => {
                    const newPagination = {
                        ...pagination,
                        currentPage: 1,
                    }
                    if (key === 'pageSize') {
                        newPagination.pageSize = parseInt(value[0], 10)
                    }

                    setPagination(newPagination)
                    setFilters({
                        ...filters,
                        [key]: value,
                    })
                }}
                onResetFilters={() => {
                    setPagination({
                        ...pagination,
                        currentPage: 1,
                        pageSize: 10,
                    })
                    setFilters({})
                }}
            />
            {isLoading && <LoadingCircles className={styles.centered} />}
            {!isLoading && pointsWinnings.length > 0 && (
                <PointsTable
                    currentPage={pagination.currentPage}
                    numPages={pagination.totalPages}
                    points={pointsWinnings}
                    onNextPageClick={async function onNextPageClicked() {
                        if (pagination.currentPage === pagination.totalPages) {
                            return
                        }

                        setPagination({
                            ...pagination,
                            currentPage: pagination.currentPage + 1,
                        })
                    }}
                    onPreviousPageClick={async function onPrevPageClicked() {
                        if (pagination.currentPage === 1) {
                            return
                        }

                        setPagination({
                            ...pagination,
                            currentPage: pagination.currentPage - 1,
                        })
                    }}
                    onPageClick={async function onPageClicked(pageNumber: number) {
                        setPagination({
                            ...pagination,
                            currentPage: pageNumber,
                        })
                    }}
                />
            )}
            {!isLoading && pointsWinnings.length === 0 && (
                <div className={styles.centered}>
                    <p className='body-main'>
                        {Object.keys(filters).length === 0
                            ? 'Your points will appear here — explore Topcoder\'s opportunities to start earning points!'
                            : 'No points match your filters.'}
                    </p>
                </div>
            )}
        </Collapsible>
    )
}

export default PointsListView
