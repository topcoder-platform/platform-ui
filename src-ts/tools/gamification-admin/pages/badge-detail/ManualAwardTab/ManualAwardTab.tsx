import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Button } from '../../../../../lib'
import { InputHandleAutocomplete } from '../../../../../lib/member-autocomplete'
import { MembersAutocompeteResult } from '../../../../../lib/member-autocomplete/input-handle-functions'
import { GameBadge } from '../../../game-lib'

import styles from './ManualAwardTab.module.scss'

export interface ManualAwardTabProps {
    awardedMembers?: GameBadge['member_badges']
}

const ManualAwardTab: FC<ManualAwardTabProps> = (props: ManualAwardTabProps) => {

    const [selectedMembers, setSelectedMembers]: [Array<MembersAutocompeteResult>, Dispatch<SetStateAction<Array<MembersAutocompeteResult>>>]
        = useState<Array<MembersAutocompeteResult>>([])

    function onAward(): void {
        setSelectedMembers([])
    }

    return (
        <div className={styles.tabWrap}>
            <h3>Manual Award</h3>
            <div className={styles.manualFormWrap}>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque ullamcorper neque sed orci, enim amet, sed.</p>
                <div className={styles.manualForm}>
                    <InputHandleAutocomplete
                        label={'Select Member'}
                        name='manual-award-member-select'
                        placeholder='Type and select member to award'
                        onChange={setSelectedMembers}
                        tabIndex={0}
                        value={selectedMembers}
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
        </div>
    )
}

export default ManualAwardTab
