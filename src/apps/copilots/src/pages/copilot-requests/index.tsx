import { FC, useCallback, useContext, useMemo, useState } from 'react'
import { find } from 'lodash'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'
import classNames from 'classnames'

import {
    Button,
    ButtonProps,
    ContentLayout,
    IconCheck,
    IconSolid,
    LoadingCircles,
    PageTitle,
    Table,
    TableColumn,
    Tooltip,
    useConfirmationModal,
} from '~/libs/ui'
import { profileContext, ProfileContextData, UserRole } from '~/libs/core'
import { EnvironmentConfig } from '~/config'
import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { ProjectTypeLabels } from '../../constants'
import { approveCopilotRequest, CopilotRequestsResponse, useCopilotRequests } from '../../services/copilot-requests'
import { CopilotRequest } from '../../models/CopilotRequest'
import { copilotRoutesMap } from '../../copilots.routes'
import { Project } from '../../models/Project'

import { CopilotRequestModal } from './copilot-request-modal'
import styles from './CopilotRequestsPage.module.scss'

const CopilotTableActions: FC<{request: CopilotRequest}> = props => {
    const navigate: NavigateFunction = useNavigate()
    const confirmModal = useConfirmationModal()

    const confirm = useCallback(async ({ title, content, action }: any) => {
        const confirmed = await confirmModal.confirm({ content, title })
        if (!confirmed) {
            return
        }

        action()
    }, [confirmModal])

    const confirmApprove = useMemo(() => confirm.bind(0, {
        action: () => approveCopilotRequest(props.request),
        content: 'Are you sure you want to approve this request?',
        title: 'Approve request',
    }), [confirm, props.request])

    const confirmReject = useMemo(() => confirm.bind(0, {
        // TODO: implement reject request
        action: () => approveCopilotRequest(props.request),
        content: 'Are you sure you want to reject this request?',
        title: 'Reject request',
    }), [confirm, props.request])

    const viewRequest = useCallback(() => {
        navigate(copilotRoutesMap.CopilotRequestDetails.replace(':requestId', `${props.request.id}`))
    }, [navigate, props.request.id])

    const isEditable = useMemo(() => !['canceled', 'fulfilled'].includes(props.request.status), [props.request.status])

    const editRequest = useCallback(() => {
        if (!isEditable) {
            return
        }

        navigate(copilotRoutesMap.CopilotRequestEditForm.replace(':requestId', `${props.request.id}`))
    }, [navigate, props.request.id, isEditable])

    const copilotOpportunityId = props.request.opportunity?.id

    const navigateToOpportunity = useCallback(() => {
        const url = copilotRoutesMap.CopilotOpportunityDetails
            .replace(':opportunityId', `${copilotOpportunityId}`)
        window.open(url, '_blank', 'noopener,noreferrer')
    }, [copilotOpportunityId])

    return (
        <>
            {confirmModal.modal}
            <div className={styles.actionButtons}>
                <div className={styles.viewRequestIcon} onClick={viewRequest}>
                    <Tooltip
                        content='View Copilot Request'
                        place='top'
                    >
                        <IconSolid.EyeIcon className='icon-lg' />
                    </Tooltip>
                </div>
                <div
                    className={classNames(styles.viewRequestIcon, !isEditable && styles.disabled)}
                    onClick={editRequest}
                >
                    {isEditable ? (
                        <Tooltip
                            content='Edit Copilot Request'
                            place='top'
                        >
                            <IconSolid.PencilIcon className='icon-lg' />
                        </Tooltip>
                    ) : (
                        <IconSolid.PencilIcon className={classNames('icon-lg', styles.disabled)} />
                    )}
                </div>
                {props.request.status === 'approved'
                && (
                    <div className={styles.viewRequestIcon} onClick={navigateToOpportunity}>
                        <Tooltip
                            content='View Copilot Opportunity'
                            place='top'
                        >
                            <IconSolid.ExternalLinkIcon className='icon-lg' />
                        </Tooltip>
                    </div>
                )}

                {props.request.status === 'new' && (
                    <>
                        <Button icon={IconCheck} primary size='sm' onClick={confirmApprove} />
                        <Button
                            icon={IconSolid.XIcon}
                            primary
                            size='sm'
                            variant='danger'
                            disabled
                            onClick={confirmReject}
                        />
                    </>
                )}
            </div>
        </>
    )
}

const CopilotRequestsPage: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()
    const [sort, setSort] = useState<Sort>({
        direction: 'desc',
        fieldName: 'createdAt',
    })

    const { profile }: ProfileContextData = useContext(profileContext)
    const isAdminOrPM: boolean = useMemo(
        () => !!profile?.roles?.some(role => role === UserRole.administrator || role === UserRole.projectManager),
        [profile],
    )

    const {
        data: requests = [],
        isValidating: requestsLoading,
        hasMoreCopilotRequests,
        setSize,
        size,
        page,
    }: CopilotRequestsResponse = useCopilotRequests(sort)

    const viewRequestDetails = useMemo(() => (
        routeParams.requestId && find(requests, { id: +routeParams.requestId }) as CopilotRequest
    ), [requests, routeParams.requestId])

    const hideRequestDetails = useCallback(() => {
        navigate(copilotRoutesMap.CopilotRequests)
    }, [navigate])

    const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.stopPropagation()
    }, [])

    const tableColumns: TableColumn<CopilotRequest>[] = [
        {
            label: 'Project',
            propertyName: 'projectName',
            renderer: (copilotRequest: CopilotRequest) => {
                const projectLink = `
                ${EnvironmentConfig.ADMIN.WORK_MANAGER_URL}/projects/${copilotRequest.projectId}/challenges
                `
                return (
                    <a
                        href={projectLink}
                        className={styles.title}
                        target='_blank'
                        rel='noreferrer'
                        onClick={handleLinkClick}
                    >
                        {copilotRequest.project?.name}
                    </a>
                )
            },
            type: 'element',
        },
        {
            className: styles.opportunityTitle,
            label: 'Title',
            propertyName: 'opportunityTitle',
            renderer: (copilotRequest: CopilotRequest) => (
                <div className={styles.title}>{copilotRequest.opportunityTitle}</div>
            ),
            type: 'element',
        },
        {
            label: 'Type',
            propertyName: 'projectType',
            type: 'text',
        },
        {
            label: 'Status',
            propertyName: 'status',
            type: 'text',
        },
        {
            label: '',
            propertyName: '',
            type: 'text',
        },
        {
            defaultSortDirection: 'desc',
            isDefaultSort: true,
            label: 'Created At',
            propertyName: 'createdAt',
            type: 'date',
        },
        {
            label: '',
            renderer: (request: CopilotRequest) => (
                <CopilotTableActions request={request} />
            ),
            type: 'action',
        },
    ]

    const tableData = useMemo(() => requests.map(request => ({
        ...request,
        projectName: request.project?.name,
        projectType: ProjectTypeLabels[request.projectType] ?? '',
    })), [requests])

    function loadMore(): void {
        setSize(size + 1)
    }

    function onToggleSort(s?: Sort): void {
        if (!s) {
            return
        }

        setSort(s)
    }

    // header button config
    const addNewRequestButton: ButtonProps = {
        label: 'New Copilot Request',
        onClick: () => navigate(copilotRoutesMap.CopilotRequestForm),
    }

    if (!isAdminOrPM) {
        return (
            <ContentLayout title='Copilot Requests'>
                <PageTitle>Access Denied</PageTitle>
                <p>You do not have required permissions to access this page.</p>
            </ContentLayout>
        )
    }

    return (
        <ContentLayout
            title='Copilot Requests'
            buttonConfig={addNewRequestButton}
        >
            <PageTitle>Copilot Requests</PageTitle>
            <Table
                className={(page === 1 && tableData.length < 10) ? styles.shortPage : styles.tableWrapper}
                columns={tableColumns}
                data={tableData}
                moreToLoad={hasMoreCopilotRequests}
                onLoadMoreClick={loadMore}
                onToggleSort={onToggleSort}
            />
            {requestsLoading && <LoadingCircles /> }
            {viewRequestDetails && (
                <CopilotRequestModal
                    request={viewRequestDetails}
                    project={viewRequestDetails.project as Project}
                    onClose={hideRequestDetails}
                />
            )}
        </ContentLayout>
    )
}

export default CopilotRequestsPage
