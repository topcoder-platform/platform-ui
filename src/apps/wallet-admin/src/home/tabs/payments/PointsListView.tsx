/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import React, { FC, useCallback, useEffect, useState } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { editPayment, exportSearchResults, getMemberHandle, getPoints } from '../../../lib/services/wallet'
import { Winning, WinningDetail, WinningsType } from '../../../lib/models/WinningDetail'
import { FilterBar, formatIOSDateString, PaymentView } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import PaymentEditForm from '../../../lib/components/payment-edit/PaymentEdit'
import PointsTable from '../../../lib/components/points-table/PointsTable'

import styles from './Payments.module.scss'

interface PointsListViewProps {
    profile: UserProfile
    isCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

const PointsListView: FC<PointsListViewProps> = (props: PointsListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)
    const [isConfirmFormValid, setIsConfirmFormValid] = React.useState<boolean>(false)
    const [hasPointsWinnings, setHasPointsWinnings] = useState<boolean>()
    const [pointsWinnings, setPointsWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(true)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const [apiErrorMsg, setApiErrorMsg] = React.useState<string>('Member points will appear here.')
    const [editState, setEditState] = React.useState<{
        grossAmount?: number;
        description?: string;
        releaseDate?: Date;
        auditNote?: string;
    }>({})

    const editStateRef = React.useRef(editState)

    useEffect(() => {
        editStateRef.current = editState
    }, [editState])

    const handleValueUpdated = useCallback((updates: {
        auditNote?: string,
        description?: string,
        grossAmount?: number,
        releaseDate?: Date,
    }) => {
        setEditState(prev => ({
            ...prev,
            ...updates,
        }))
    }, [])

    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })

    const convertToPoints = useCallback(
        async (pointsData: WinningDetail[], handleMap: Map<number, string>): Promise<ReadonlyArray<Winning>> => pointsData.map(point => {
            const now = new Date()
            const releaseDate = new Date(point.releaseDate)
            const diffMs = releaseDate.getTime() - now.getTime()
            const diffHours = diffMs / (1000 * 60 * 60)

            let formattedReleaseDate
            if (diffHours > 0 && diffHours <= 24) {
                const diffMinutes = diffMs / (1000 * 60)
                const hours = Math.floor(diffHours)
                const minutes = Math.round(diffMinutes - hours * 60)
                formattedReleaseDate = `${minutes} minute${minutes !== 1 ? 's' : ''}`
                if (hours > 0) {
                    formattedReleaseDate = `In ${hours} hour${hours !== 1 ? 's' : ''} ${formattedReleaseDate}`
                } else if (minutes > 0) {
                    formattedReleaseDate = `In ${minutes} minute${minutes !== 1 ? 's' : ''}`
                }
            } else {
                formattedReleaseDate = formatIOSDateString(point.releaseDate)
            }

            return {
                createDate: formatIOSDateString(point.createdAt),
                currency: point.details[0].currency || 'USD',
                datePaid: point.details[0].datePaid ? formatIOSDateString(point.details[0].datePaid) : '-',
                description: point.description,
                details: point.details,
                externalId: point.externalId,
                grossAmount: parseFloat(point.details[0].totalAmount)
                    .toString(),
                grossAmountNumber: parseFloat(point.details[0].totalAmount),
                handle: handleMap.get(parseInt(point.winnerId, 10)) ?? point.winnerId,
                id: point.id,
                releaseDate: formattedReleaseDate,
                releaseDateObj: releaseDate,
                status: 'Points',
                type: point.category.replaceAll('_', ' ')
                    .toLowerCase(),
            }
        }),
        [],
    )

    const fetchPoints = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await getPoints(pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, filters)
            const winnerIds = response.winnings.map(winning => winning.winnerId)
            const handleMap = await getMemberHandle(winnerIds)
            const pointsData = await convertToPoints(response.winnings, handleMap)
            setPointsWinnings(pointsData)
            setPagination(response.pagination)
        } catch (apiError) {
            console.error('Failed to fetch points:', apiError)
            if (apiError instanceof AxiosError && apiError?.response?.status === 403) {
                setApiErrorMsg(apiError.response.data.message)
            } else {
                setApiErrorMsg('Failed to fetch points. Please try again later.')
            }

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
    }, [convertToPoints, filters, pagination.currentPage, pagination.pageSize])

    useEffect(() => {
        fetchPoints()
    }, [fetchPoints])

    const renderConfirmModalContent = React.useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    const updatePoint = async (pointId: string): Promise<void> => {
        const currentEditState = editStateRef.current
        const updateObj = {
            auditNote: currentEditState.auditNote !== undefined ? currentEditState.auditNote : undefined,
            description: currentEditState.description !== undefined ? currentEditState.description : undefined,
            grossAmount: currentEditState.grossAmount !== undefined ? currentEditState.grossAmount : undefined,
            releaseDate: currentEditState.releaseDate !== undefined ? currentEditState.releaseDate : undefined,
        }

        const updates: {
            auditNote?: string
            description?: string
            releaseDate?: string
            paymentAmount?: number
            winningsId: string
        } = {
            auditNote: updateObj.auditNote,
            winningsId: pointId,
        }

        if (updateObj.description) updates.description = updateObj.description
        if (updateObj.releaseDate !== undefined) updates.releaseDate = updateObj.releaseDate.toISOString()
        if (updateObj.grossAmount !== undefined) updates.paymentAmount = updateObj.grossAmount

        toast.success('Updating points', { position: toast.POSITION.BOTTOM_RIGHT })
        try {
            const updateMessage = await editPayment(updates)
            toast.success(updateMessage, { position: toast.POSITION.BOTTOM_RIGHT })
        } catch (err:any) {
            if (err?.message) {
                toast.error(err?.message, { position: toast.POSITION.BOTTOM_RIGHT })
            } else {
                toast.error('Failed to update points', { position: toast.POSITION.BOTTOM_RIGHT })
            }

            return
        }

        setEditState({})

        await fetchPoints()
    }

    useEffect(() => {
        if (isLoading || hasPointsWinnings !== undefined) {
            return
        }

        setHasPointsWinnings(pointsWinnings.length > 0)
    }, [isLoading, pointsWinnings])

    const onPointEditCallback = useCallback((point: Winning) => {
        setConfirmFlow({
            action: 'Save',
            callback: async () => {
                updatePoint(point.id)
            },
            content: (
                <PaymentEditForm
                    payment={point}
                    canSave={setIsConfirmFormValid}
                    onValueUpdated={handleValueUpdated}
                    isPointsEdit
                />
            ),
            title: 'Edit Points',
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleValueUpdated, editState, fetchPoints])

    const isEditingAllowed = (): boolean => (
        props.profile.roles.includes('Payment Admin')
        || props.profile.roles.includes('Payment BA Admin')
        || props.profile.roles.includes('Payment Editor')
    )

    if (!hasPointsWinnings) {
        return <></>
    }

    return (
        <>
            <Collapsible
                header={<h3>Points Listing</h3>}
                isCollapsed={props.isCollapsed}
                onToggle={props.onToggle}
            >
                <FilterBar
                    showExportButton
                    onExport={async () => {
                        toast.success('Downloading points report. This may take a few moments.', { position: toast.POSITION.BOTTOM_RIGHT })
                        downloadBlob(
                            await exportSearchResults(filters, WinningsType.POINTS),
                            `points-${new Date()
                                .getTime()}.csv`,
                        )
                        toast.success('Download complete', { position: toast.POSITION.BOTTOM_RIGHT })
                    }}
                    filters={[
                        {
                            key: 'winnerIds',
                            label: 'Username/Handle',
                            type: 'member_autocomplete',
                        },
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
                        canEdit={isEditingAllowed()}
                        currentPage={pagination.currentPage}
                        numPages={pagination.totalPages}
                        points={pointsWinnings}
                        onPointEditClick={(point: Winning) => {
                            setEditState({})
                            onPointEditCallback(point)
                        }}
                        onPointViewClick={function onPointViewClicked(point: Winning) {
                            setConfirmFlow({
                                action: 'Save',
                                callback: async () => {
                                    updatePoint(point.id)
                                },
                                content: (
                                    <PaymentView
                                        payment={point}
                                        isPoints
                                    />
                                ),
                                showButtons: false,
                                title: 'Points Details',
                            })
                        }}
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
                                ? apiErrorMsg
                                : 'No points match your filters.'}
                        </p>
                    </div>
                )}
            </Collapsible>
            {confirmFlow && (
                <ConfirmModal
                    maxWidth='800px'
                    size='lg'
                    showButtons={confirmFlow.showButtons}
                    title={confirmFlow.title}
                    action={confirmFlow.action}
                    onClose={function onClose() {
                        setEditState({})
                        setConfirmFlow(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        confirmFlow.callback?.()
                        setConfirmFlow(undefined)
                    }}
                    canSave={isConfirmFormValid}
                    open={confirmFlow !== undefined}
                >
                    <div>{renderConfirmModalContent}</div>
                </ConfirmModal>
            )}
        </>
    )
}

export default PointsListView
