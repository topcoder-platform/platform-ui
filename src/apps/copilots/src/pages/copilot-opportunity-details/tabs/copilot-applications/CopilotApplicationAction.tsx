import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { mutate } from 'swr'
import { useCallback, useMemo, useState } from 'react'

import { assignCopilotOpportunity, copilotBaseUrl } from '~/apps/copilots/src/services/copilot-opportunities'
import { CopilotApplication, CopilotApplicationStatus } from '~/apps/copilots/src/models/CopilotApplication'
import { IconSolid, Tooltip } from '~/libs/ui'

import AlreadyMemberModal from './AlreadyMemberModal'
import styles from './styles.module.scss'

const CopilotApplicationAction = (
    copilotApplication: CopilotApplication,
    allCopilotApplications: CopilotApplication[],
): JSX.Element => {
    const { opportunityId }: {opportunityId?: string} = useParams<{ opportunityId?: string }>()
    const [showAlreadyMemberModal, setShowAlreadyMemberModal] = useState(false)
    const isInvited = useMemo(
        () => allCopilotApplications
            && allCopilotApplications.findIndex(item => item.status === CopilotApplicationStatus.INVITED) > -1,
        [allCopilotApplications],
    )
    const onClick = useCallback(async () => {
        if (
            copilotApplication.status !== CopilotApplicationStatus.PENDING
            || isInvited
            || copilotApplication.opportunityStatus !== 'active'
        ) {
            return
        }

        if (copilotApplication.existingMembership) {
            setShowAlreadyMemberModal(true)
            return
        }

        if (opportunityId) {
            try {
                await assignCopilotOpportunity(opportunityId, copilotApplication.id)
                toast.success('Accepted as copilot')
                mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
            } catch (e) {
                const error = e as Error
                toast.error(error.message)
            }

        }
    }, [opportunityId, copilotApplication])

    const onApply = useCallback(async () => {
        try {
            if (!opportunityId) {
                return
            }

            await assignCopilotOpportunity(opportunityId, copilotApplication.id)
            toast.success('Accepted as copilot')
            mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
            setShowAlreadyMemberModal(false)
        } catch (e) {
            const error = e as Error
            toast.error(error.message)
        }
    }, [opportunityId, copilotApplication])

    const onCloseModal = useCallback((e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault()
        e.stopPropagation()
        setShowAlreadyMemberModal(false)
    }, [showAlreadyMemberModal])

    return (
        <div onClick={onClick} className={styles.actionWrapper}>
            {
                copilotApplication.status === CopilotApplicationStatus.INVITED && (
                    <Tooltip content='User already invited'>
                        <IconSolid.MailOpenIcon />
                    </Tooltip>
                )
            }

            {
                !isInvited
                && copilotApplication.status === CopilotApplicationStatus.PENDING
                && copilotApplication.opportunityStatus === 'active' && (
                    <Tooltip content='Accept Application'>
                        <IconSolid.UserAddIcon />
                    </Tooltip>
                )
            }

            {
                copilotApplication.status === CopilotApplicationStatus.ACCEPTED && (
                    <Tooltip content='Application Accepted'>
                        <IconSolid.BadgeCheckIcon />
                    </Tooltip>
                )
            }

            {showAlreadyMemberModal && (
                <AlreadyMemberModal
                    projectName={copilotApplication.projectName}
                    handle={copilotApplication.handle}
                    onClose={onCloseModal}
                    onApply={onApply}
                    copilotApplication={copilotApplication}
                />
            )}
        </div>
    )
}

export default CopilotApplicationAction
