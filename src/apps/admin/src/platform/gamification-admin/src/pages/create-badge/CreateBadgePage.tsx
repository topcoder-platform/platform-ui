import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'

import { ContentLayout } from '~/libs/ui'

import { GameBadge } from '../../game-lib'
import { BadgeCreatedModal } from '../../game-lib/modals/badge-created-modal'

import { CreateBadgeForm, createBadgeFormDef } from './create-badge-form'
import styles from './CreateBadgePage.module.scss'

interface Props extends GameBadge {
    rootPage: string;
}
const CreateBadgePage: FC<Props> = (props: Props) => {
    const formDef = useMemo(() => createBadgeFormDef(props.rootPage), [props.rootPage])

    const [showBadgeCreatedModal, setShowBadgeCreatedModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [createdBadge, setCreatedBadge]: [GameBadge | undefined, Dispatch<SetStateAction<GameBadge | undefined>>]
        = useState<GameBadge | undefined>()

    function onSave(newBadge: GameBadge): void {
        setCreatedBadge(newBadge)
        setShowBadgeCreatedModal(true)
    }

    function handleCloseCreateModal(): void {
        setCreatedBadge(undefined)
        setShowBadgeCreatedModal(false)
    }

    return (
        <ContentLayout
            title='Create Badge'
        >
            <div className={styles.container}>
                <CreateBadgeForm
                    formDef={formDef}
                    onSave={onSave}
                />
            </div>
            {
                createdBadge && (
                    <BadgeCreatedModal
                        rootPage={props.rootPage}
                        badge={createdBadge}
                        isOpen={showBadgeCreatedModal}
                        onClose={handleCloseCreateModal}
                    />
                )
            }
        </ContentLayout>
    )
}

export default CreateBadgePage
