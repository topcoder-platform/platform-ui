import { find } from 'lodash'
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Button } from '~/libs/ui'

import { GameBadge, InputHandleAutocomplete, MembersAutocompeteResult } from '../../../game-lib'
import { BadgeAssignedModal } from '../../../game-lib/modals/badge-assigned-modal'
import { generateCSV, manualAssignRequestAsync } from '../badge-details.functions'

import styles from './ManualAwardTab.module.scss'

export interface ManualAwardTabProps {
    badge: GameBadge,
    onManualAssign: () => void
}

const ManualAwardTab: FC<ManualAwardTabProps> = (props: ManualAwardTabProps) => {

    const [selectedMembers, setSelectedMembers]: [
        Array<MembersAutocompeteResult>,
        Dispatch<SetStateAction<Array<MembersAutocompeteResult>>>
    ]
        = useState<Array<MembersAutocompeteResult>>([])

    const [showBadgeAssigned, setShowBadgeAssigned]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)

    const [badgeAssignError, setBadgeAssignError]: [
        string | undefined,
        Dispatch<SetStateAction<string | undefined>>
    ] = useState<string | undefined>()

    function onAward(): void {
        const csv: string = generateCSV(
            selectedMembers.map(m => [m.handle, props.badge?.id as string]),
        )
        setBadgeAssignError(undefined)
        manualAssignRequestAsync(csv)
            .then(() => {
                setShowBadgeAssigned(true)
                setSelectedMembers([])
            })
            .catch(e => {
                let message: string = e.message
                if (e.errors && e.errors[0] && e.errors[0].path === 'user_id') {
                    const handleOrId: string = find(
                        selectedMembers,
                        { userId: e.errors[0].value },
                    )?.handle || e.errors[0].value
                    message = `Member ${handleOrId} already owns this badge.`
                }

                setBadgeAssignError(message)
            })
    }

    function handleModalClose(): void {
        setShowBadgeAssigned(false)
        props.onManualAssign()
    }

    return (
        <div className={styles.tabWrap}>
            <h3>Manual Award</h3>
            <div className={styles.manualFormWrap}>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Neque ullamcorper neque sed orci, enim amet, sed.
                </p>
                <div className={styles.manualForm}>
                    <InputHandleAutocomplete
                        label='Select Member'
                        name='manual-award-member-select'
                        placeholder='Type and select member to award'
                        onChange={setSelectedMembers}
                        tabIndex={0}
                        value={selectedMembers}
                        error={badgeAssignError}
                        dirty={!!badgeAssignError}
                    />
                    <div className={styles.actionsWrap}>
                        <Button
                            buttonStyle='secondary'
                            label='Award'
                            className={styles.awardBtn}
                            disable={!selectedMembers.length}
                            onClick={onAward}
                        />
                    </div>
                </div>
            </div>
            {
                showBadgeAssigned && (
                    <BadgeAssignedModal
                        badge={props.badge}
                        isOpen={showBadgeAssigned}
                        onClose={handleModalClose}
                    />
                )
            }
        </div>
    )
}

export default ManualAwardTab
