import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { mutate } from 'swr'
import { useCallback, useMemo } from 'react'

import { assignCopilotOpportunity, copilotBaseUrl } from '~/apps/copilots/src/services/copilot-opportunities'
import { CopilotApplication, CopilotApplicationStatus } from '~/apps/copilots/src/models/CopilotApplication'
import { IconSolid, Tooltip } from '~/libs/ui'

import styles from './styles.module.scss'

const CopilotApplicationAction = (
    copilotApplication: CopilotApplication,
    allCopilotApplications: CopilotApplication[],
): JSX.Element => {
    const { opportunityId }: {opportunityId?: string} = useParams<{ opportunityId?: string }>()
    const isInvited = useMemo(
        () => allCopilotApplications.findIndex(item => item.status === CopilotApplicationStatus.INVITED) > -1,
        [allCopilotApplications],
    )
    const onClick = useCallback(async () => {
        if (copilotApplication.status !== CopilotApplicationStatus.PENDING || isInvited) {
            return
        }

        if (opportunityId) {
            try {
                await assignCopilotOpportunity(opportunityId, copilotApplication.id)
                toast.success('Invited a copilot')
                mutate(`${copilotBaseUrl}/copilots/opportunity/${opportunityId}/applications`)
            } catch (e) {
                const error = e as Error
                toast.error(error.message)
            }

        }
    }, [opportunityId, copilotApplication])
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
                !isInvited && copilotApplication.status === CopilotApplicationStatus.PENDING && (
                    <IconSolid.UserAddIcon />
                )
            }

            {
                copilotApplication.status === CopilotApplicationStatus.ACCEPTED && (
                    <IconSolid.BadgeCheckIcon />
                )
            }
        </div>
    )
}

export default CopilotApplicationAction
