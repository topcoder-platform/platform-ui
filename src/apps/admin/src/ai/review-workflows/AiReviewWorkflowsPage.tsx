import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'
import FormToggleSwitch from '~/libs/ui/lib/components/form/form-groups/form-toggle-switch'

import { ConfirmModal, PageWrapper, TableLoading, TableNoRecord } from '../../lib'
import { TableMobile } from '../../lib/components/common/TableMobile'
import { TableWrapper } from '../../lib/components/common/TableWrapper'
import { MobileTableColumn } from '../../lib/models'
import { AiWorkflow, getAiWorkflows, updateAiWorkflow } from '../../lib/services/ai-workflows.service'

import { WorkflowDetailsModal } from './WorkflowDetailsModal'
import styles from './AiReviewWorkflowsPage.module.scss'

function stopPropagation(e: React.MouseEvent): void {
    e.stopPropagation()
}

export const AiReviewWorkflowsPage: FC = () => {
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [workflows, setWorkflows] = useState<AiWorkflow[]>([])
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; workflow?: AiWorkflow }>({
        open: false,
    })
    const [detailModal, setDetailModal] = useState<{ open: boolean; workflow?: AiWorkflow }>({
        open: false,
    })
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isMobile = useMemo(() => screenWidth <= 1050, [screenWidth])

    useEffect(() => {
        setIsLoading(true)
        getAiWorkflows()
            .then(setWorkflows)
            .finally(() => setIsLoading(false))
    }, [])

    const handleToggleClick = useCallback((workflow: AiWorkflow) => {
        setConfirmModal({ open: true, workflow })
    }, [])

    const handleCloseConfirm = useCallback(() => {
        setConfirmModal({ open: false })
    }, [])

    const handleNameClick = useCallback((workflow: AiWorkflow) => {
        setDetailModal({ open: true, workflow })
    }, [])

    const handleCloseDetail = useCallback(() => {
        setDetailModal({ open: false })
    }, [])

    const handleConfirmToggle = useCallback(async () => {
        if (!confirmModal.workflow) {
            return
        }

        const newDisabledState = !confirmModal.workflow.disabled

        setIsUpdating(true)
        try {
            await updateAiWorkflow(confirmModal.workflow.id, {
                disabled: newDisabledState,
            })
            setWorkflows(prev => prev.map(w => (
                w.id === confirmModal.workflow?.id
                    ? { ...w, disabled: newDisabledState }
                    : w
            )))
            toast.success(`Workflow ${newDisabledState ? 'deactivated' : 'activated'} successfully`)
        } catch (error) {
            toast.error('Failed to update workflow')
        } finally {
            setIsUpdating(false)
            setConfirmModal({ open: false })
        }
    }, [confirmModal.workflow])

    const columns = useMemo<TableColumn<AiWorkflow>[]>(() => [
        {
            label: 'ID',
            propertyName: 'id',
            renderer: (data: AiWorkflow) => (
                <div className={styles.cellText}>{data.id}</div>
            ),
            type: 'element',
        },
        {
            defaultSortDirection: 'asc',
            label: 'Active',
            propertyName: 'disabled',
            renderer: (data: AiWorkflow) => {
                function onToggleChange(): void {
                    handleToggleClick(data)
                }

                return (
                    <div className={styles.toggle} onClick={stopPropagation}>
                        <FormToggleSwitch
                            name={`active-${data.id}`}
                            value={!data.disabled}
                            onChange={onToggleChange}
                        />
                    </div>
                )
            },
            type: 'element',
        },
        {
            defaultSortDirection: 'asc',
            isDefaultSort: true,
            label: 'Name',
            propertyName: 'name',
            renderer: (data: AiWorkflow) => {
                function onNameClick(e: React.MouseEvent): void {
                    e.stopPropagation()
                    handleNameClick(data)
                }

                return (
                    <button
                        type='button'
                        className={styles.nameLink}
                        onClick={onNameClick}
                    >
                        {data.name}
                    </button>
                )
            },
            type: 'element',
        },
        {
            defaultSortDirection: 'asc',
            label: 'Provider/LLM',
            propertyName: 'llm.provider.name',
            renderer: (data: AiWorkflow) => (
                <div className={styles.cellText} title={`${data.llm?.provider?.name}/${data.llm?.name}`}>
                    {data.llm?.provider?.name}
                    /
                    {data.llm?.name}
                </div>
            ),
            type: 'element',
        },
        {
            label: 'Scorecard',
            renderer: (data: AiWorkflow) => {
                if (!data.scorecard?.id) {
                    return <span>{data.scorecard?.name || 'N/A'}</span>
                }

                return (
                    <a
                        className={styles.link}
                        href={`${EnvironmentConfig.REVIEW_APP_URL}/scorecard/${data.scorecard.id}`}
                        target='_blank'
                        rel='noreferrer'
                        onClick={stopPropagation}
                    >
                        {data.scorecard.name}
                    </a>
                )
            },
            type: 'element',
        },
    ], [])

    const columnsMobile = useMemo<MobileTableColumn<AiWorkflow>[][]>(
        () => columns.map(column => {
            if (column.label === 'Active') {
                return [
                    {
                        ...column,
                        className: '',
                        label: 'Active label',
                        mobileType: 'label',
                        renderer: () => <div>Active:</div>,
                        type: 'element',
                    },
                    {
                        ...column,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
                {
                    ...column,
                    className: '',
                    label: `${column.label as string} label`,
                    mobileType: 'label',
                    renderer: () => (
                        <div>
                            {column.label as string}
                            :
                        </div>
                    ),
                    type: 'element',
                },
                {
                    ...column,
                    mobileType: 'last-value',
                },
            ]
        }),
        [columns],
    )

    return (
        <PageWrapper pageTitle='AI Review Workflows'>
            {isLoading ? (
                <TableLoading />
            ) : (
                <>
                    {workflows.length === 0 ? (
                        <TableNoRecord />
                    ) : (
                        <TableWrapper>
                            {isMobile ? (
                                <TableMobile
                                    columns={columnsMobile}
                                    data={workflows}
                                    className={styles.mobileTable}
                                />
                            ) : (
                                <Table
                                    columns={columns}
                                    data={workflows}
                                    initSort={{ direction: 'asc', fieldName: 'name' }}
                                    className={styles.table}
                                />
                            )}
                        </TableWrapper>
                    )}
                </>
            )}
            <ConfirmModal
                title='Confirm Status Change'
                action={confirmModal.workflow?.disabled ? 'Activate' : 'Deactivate'}
                open={confirmModal.open}
                onClose={handleCloseConfirm}
                onConfirm={handleConfirmToggle}
                isLoading={isUpdating}
            >
                <p>
                    Are you sure you want to
                    {' '}
                    <strong>{confirmModal.workflow?.disabled ? 'activate' : 'deactivate'}</strong>
                    {' '}
                    the workflow
                    {' '}
                    <strong>{confirmModal.workflow?.name}</strong>
                    ?
                </p>
            </ConfirmModal>
            <WorkflowDetailsModal
                workflow={detailModal.workflow}
                open={detailModal.open}
                onClose={handleCloseDetail}
            />
        </PageWrapper>
    )
}

export default AiReviewWorkflowsPage
