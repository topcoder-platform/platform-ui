import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Button, IconSolid, InputFilePicker } from '../../../../../lib'
import { GameBadge } from '../../../game-lib'
import { BadgeAssignedModal } from '../../../game-lib/modals/badge-assigned-modal'

import styles from './BatchAwardTab.module.scss'
interface BatchAwardTabProps {
    badge: GameBadge,
    onBatchAssign: () => void
}

const BatchAwardTab: FC<BatchAwardTabProps> = (props: BatchAwardTabProps) => {

    const [showBadgeAssigned, setShowBadgeAssigned]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    // tslint:disable-next-line:no-null-keyword
    const [files, setFiles]: [FileList | null, Dispatch<SetStateAction<FileList | null>>] = useState<FileList | null>(null)

    const [errorText, setErrorText]: [string, Dispatch<SetStateAction<string>>] = useState<string>('')

    function onFilePick(fileList: FileList | null): void {
        if (fileList && fileList[0] && fileList[0].type !== 'text/csv') {
            setErrorText('Only CSV files are allowed.')
        } else {
            setFiles(fileList)
            setErrorText('')
        }
    }

    function onAward(): void {

    }

    return (
        <div className={styles.tabWrap}>
            <h3>Batch Award</h3>
            <div className={styles.batchFormWrap}>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque ullamcorper neque sed orci, enim amet, sed.</p>
                <div className={styles.batchForm}>
                    <InputFilePicker
                        fileConfig={{
                            acceptFileType: 'text/csv',
                        }}
                        name='batch-import-file'
                        onChange={onFilePick}
                    />
                    {errorText && (
                        <div className={styles.error}>
                            <IconSolid.ExclamationIcon />
                            {errorText}
                        </div>
                    )}
                    <div className={styles.actionsWrap}>
                        <Button
                            buttonStyle='secondary'
                            label='Award'
                            className={styles.awardBtn}
                            disable={!files?.length}
                            onClick={onAward}
                        />
                    </div>
                </div>
            </div>
            {
                showBadgeAssigned && <BadgeAssignedModal
                    badge={props.badge}
                    isOpen={showBadgeAssigned}
                    onClose={() => {
                        setShowBadgeAssigned(false)
                        props.onBatchAssign()
                    }}
                />
            }
        </div>
    )
}

export default BatchAwardTab
