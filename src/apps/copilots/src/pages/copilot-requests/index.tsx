import { FC, useCallback, useMemo } from 'react'
import { find } from 'lodash'
import { NavigateFunction, Params, useNavigate, useParams } from 'react-router-dom'

import {
    Button,
    ButtonProps,
    ContentLayout,
    IconCheck,
    IconSolid,
    LoadingSpinner,
    PageTitle,
    Table,
    TableColumn,
    useConfirmationModal,
} from '~/libs/ui'

import { ProjectTypeLabels } from '../../constants'
import { approveCopilotRequest, CopilotRequestsResponse, useCopilotRequests } from '../../services/copilot-requests'
import { CopilotRequest } from '../../models/CopilotRequest'
import { ProjectsResponse, useProjects } from '../../services/projects'
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

    return (
        <>
            {confirmModal.modal}
            <div className={styles.actionButtons}>
                <div className={styles.viewRequestIcon} onClick={viewRequest}>
                    <IconSolid.EyeIcon className='icon-lg' />
                </div>
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

const tableColumns: TableColumn<CopilotRequest>[] = [
    {
        label: 'Project',
        propertyName: 'projectName',
        type: 'text',
    },
    {
        label: 'Type',
        propertyName: 'type',
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

const CopilotRequestsPage: FC = () => {
    const navigate: NavigateFunction = useNavigate()
    const routeParams: Params<string> = useParams()

    const { data: requests = [], isValidating: requestsLoading }: CopilotRequestsResponse = useCopilotRequests()
    const projectIds = useMemo(() => (
        (new Set(requests.map(r => r.projectId))
            .values() as any)
            .toArray()
    ), [requests])

    const { data: projects = [], isValidating: projectsLoading }: ProjectsResponse = useProjects(undefined, {
        filter: { id: projectIds },
        isPaused: () => !projectIds?.length,
    })
    const isLoading = projectsLoading || requestsLoading

    const viewRequestDetails = useMemo(() => (
        routeParams.requestId && find(requests, { id: +routeParams.requestId }) as CopilotRequest
    ), [requests, routeParams.requestId])

    const hideRequestDetails = useCallback(() => {
        navigate(copilotRoutesMap.CopilotRequests)
    }, [navigate])

    const projectsMap = useMemo(() => projects.reduce((all, c) => (
        Object.assign(all, { [c.id]: c })
    ), {} as {[key: string]: Project}), [projects])

    const tableData = useMemo(() => requests.map(request => ({
        ...request,
        projectName: projectsMap[request.projectId]?.name,
        type: ProjectTypeLabels[request.projectType] ?? '',
    })), [projectsMap, requests])

    // header button config
    const addNewRequestButton: ButtonProps = {
        label: 'New Copilot Request',
        onClick: () => navigate(copilotRoutesMap.CopilotRequestForm),
    }

    return (
        <ContentLayout
            title='Copilot Requests'
            buttonConfig={addNewRequestButton}
        >
            <PageTitle>Copilot Requests</PageTitle>
            {isLoading ? (
                <LoadingSpinner inline />
            ) : (
                <Table
                    columns={tableColumns}
                    data={tableData}
                />
            )}
            {viewRequestDetails && (
                <CopilotRequestModal
                    request={viewRequestDetails}
                    project={projectsMap[viewRequestDetails.projectId]}
                    onClose={hideRequestDetails}
                />
            )}
        </ContentLayout>
    )
}

export default CopilotRequestsPage
