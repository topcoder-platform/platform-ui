import { Dispatch, FC, SetStateAction, useState } from 'react'

import { IconSolid, InputFilePicker, Button } from '~/libs/ui'

import { GameBadge } from '../../../game-lib'
import { BadgeAssignedModal } from '../../../game-lib/modals/badge-assigned-modal'
import { batchAssignRequestAsync } from '../badge-details.functions'

import styles from './BatchAwardTab.module.scss'

interface BatchAwardTabProps {
    badge: GameBadge,
    onBatchAssign: () => void
}

const BatchAwardTab: FC<BatchAwardTabProps> = (props: BatchAwardTabProps) => {

    const [showBadgeAssigned, setShowBadgeAssigned]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)

    const [files, setFiles]: [
        FileList | undefined,
        Dispatch<SetStateAction<FileList | undefined>>
    ] = useState<FileList | undefined>(undefined)

    const [errorText, setErrorText]: [string, Dispatch<SetStateAction<string>>] = useState<string>('')

    function onFilePick(fileList: FileList | undefined): void {
        if (fileList && fileList[0] && fileList[0].type !== 'text/csv') {
            setErrorText('Only CSV files are allowed.')
        } else {
            setFiles(fileList)
            setErrorText('')
        }
    }

    function onAward(): void {
        batchAssignRequestAsync(files?.item(0) as File)
            .then(() => {
                setShowBadgeAssigned(true)
                setFiles(undefined)
            })
            .catch(e => {
                let message: string = e.message
                if (e.errors && e.errors[0] && e.errors[0].path === 'user_id') {
                    message = 'CSV file contains duplicate data. There are members included already owning this badge.'
                }

                setErrorText(message)
            })
    }

    function handleModalClose(): void {
        setShowBadgeAssigned(false)
        props.onBatchAssign()
    }

    return (
        <div className={styles.tabWrap}>
            <h3>Batch Award</h3>
            <div className={styles.batchFormWrap}>
                <div>
                    <p>
                        If you would like to assign multiple people to multiple badges,
                        this area is for you. Download the template below, populate the
                        file with your data, and upload that file to the right once completed.
                    </p>
                    <a
                        target='_blank'
                        href='/gamification-admin/bulk.sample.csv'
                        download='bulk.sample.csv'
                        className={styles.templateLink}
                    >
                        Download template CSV
                    </a>
                </div>
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
                            secondary
                            size='lg'
                            label='Award'
                            className={styles.awardBtn}
                            disabled={!files?.length}
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

export default BatchAwardTab
