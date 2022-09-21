import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../lib'
import { useGamificationBreadcrumb } from '../../game-lib'
import { BadgeCreatedModal } from '../../game-lib/modals/badge-created-modal'

import { CreateBadgeForm, createBadgeFormDef } from './create-badge-form'
import styles from './CreateBadgePage.module.scss'

const CreateBadgePage: FC = () => {

    const breadcrumb: Array<BreadcrumbItemModel> = useGamificationBreadcrumb([
        {
            name: 'create badge',
            url: '#',
        },
    ])

    const [showBadgeCreatedModal, setShowBadgeCreatedModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function onSave() {
        setShowBadgeCreatedModal(true)
    }

    return (
        <ContentLayout
            title='Create Badge'
        >
            <Breadcrumb items={breadcrumb} />
            <div className={styles.container}>
                <CreateBadgeForm
                    formDef={createBadgeFormDef}
                    onSave={onSave}
                />
            </div>
            <BadgeCreatedModal
                isOpen={showBadgeCreatedModal}
                onClose={() => setShowBadgeCreatedModal(false)}
            />
        </ContentLayout>
    )
}

export default CreateBadgePage
