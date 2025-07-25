import { FC, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { BaseModal, Button, IconSolid, useConfirmationModal } from '~/libs/ui'
import { textFormatDateLocaleShortString } from '~/libs/shared'

import { CopilotRequest } from '../../../models/CopilotRequest'
import { Project } from '../../../models/Project'
import { approveCopilotRequest } from '../../../services/copilot-requests'
import { copilotRoutesMap } from '../../../copilots.routes'

import styles from './CopilotRequestModal.module.scss'

interface CopilotRequestModalProps {
    onClose: () => void
    project: Project
    request: CopilotRequest
}

const CopilotRequestModal: FC<CopilotRequestModalProps> = props => {
    const confirmModal = useConfirmationModal()
    const navigate = useNavigate()

    const isEditable = useMemo(() => !['canceled', 'fulfilled'].includes(props.request.status), [props.request.status])

    const editRequest = useCallback(() => {
        if (!isEditable) {
            return
        }

        navigate(copilotRoutesMap.CopilotRequestEditForm.replace(':requestId', `${props.request.id}`))
    }, [isEditable, navigate, props.request.id])

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

    return (
        <BaseModal
            onClose={props.onClose}
            open
            size='lg'
            title='Copilot Request'
            buttons={(
                <>
                    {isEditable && (
                        <Button primary onClick={editRequest} label='Edit Request' className={styles.mrAuto} />
                    )}
                    {props.request.status === 'new' && (
                        <>
                            <Button primary onClick={confirmApprove} label='Approve Request' />
                            <Button primary variant='danger' onClick={confirmReject} label='Reject Request' />
                        </>
                    )}
                </>
            )}
        >
            <div className={styles.wrap}>
                <div className={styles.detailsLine}>
                    <div>Project</div>
                    <div>{props.project?.name}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Title</div>
                    <div>{props.request.opportunityTitle}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Opportunity details</div>
                    <a
                        href={copilotRoutesMap.CopilotOpportunityDetails
                            .replace(':opportunityId', `${props.request.opportunity?.id}`)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={styles.iconLink}
                    >
                        <IconSolid.ExternalLinkIcon className='icon-lg' />
                    </a>
                </div>
                <div className={styles.detailsLine}>
                    <div>Request Status</div>
                    <div>{props.request.status}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Project Type</div>
                    <div>{props.request.projectType}</div>
                </div>
                {props.request.copilotUsername && (
                    <div className={styles.detailsLine}>
                        <div>Requested Copilot</div>
                        <div>{props.request.copilotUsername}</div>
                    </div>
                )}
                <div className={styles.detailsLine}>
                    <div>Complexity</div>
                    <div>{props.request.complexity}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Overview</div>
                    <div>{props.request.overview}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Skills</div>
                    <div>
                        {
                            props.request.skills
                                .map(s => s.name)
                                .join(', ')
                        }
                    </div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Start Date</div>
                    <div>{textFormatDateLocaleShortString(new Date(props.request.startDate ?? ''))}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Duration (weeks)</div>
                    <div>{props.request.numWeeks}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Timezone requirements or restrictions</div>
                    <div>{props.request.tzRestrictions}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Commitment per week (hours)</div>
                    <div>{props.request.numHoursPerWeek}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Require direct spoken communication with the customer (i.e. phone calls, WebEx, etc.)</div>
                    <div>{props.request.requiresCommunication}</div>
                </div>
                <div className={styles.detailsLine}>
                    <div>Payment type (standard/something else)</div>
                    <div>
                        {props.request.paymentType === 'other' && props.request.otherPaymentType
                            ? props.request.otherPaymentType : props.request.paymentType}
                    </div>
                </div>
            </div>
        </BaseModal>
    )
}

export default CopilotRequestModal
