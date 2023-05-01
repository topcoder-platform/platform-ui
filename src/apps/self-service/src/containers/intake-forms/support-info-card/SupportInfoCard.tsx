import React, { Dispatch, SetStateAction, useState } from 'react'

import { Button } from '~/libs/ui'
import { ContactSupportModal, useCheckIsMobile } from '~/libs/shared'

import { InfoCard } from '../../../components/info-card'

import styles from './SupportInfoCard.module.scss'

const SupportInfoCard: React.FC = () => {

    const [showSupportModal, setShowSupportModal]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const isMobile: boolean = useCheckIsMobile()

    function openSupportModal(): void {
        setShowSupportModal(true)
    }

    function closeSupportModal(): void {
        setShowSupportModal(false)
    }

    return (
        <>
            <InfoCard
                color='warn'
                defaultOpen={!isMobile}
                isCollapsible
                title='Not seeing what you need?'
                styleNames={['noMargin']}
            >
                <div>
                    Topcoder also offers solutions for multiple other technical needs and problems.
                    We have community members expertly skilled in Development, UX / UI Design, Data
                    Science, Quality Assurance, and more.
                    We’d love to talk with you about all of our services.
                </div>
                <div className={styles.supportButton}>
                    <Button
                        primary
                        size='lg'
                        label='Contact Support'
                        onClick={openSupportModal}
                    />
                </div>
                <ContactSupportModal
                    isOpen={showSupportModal}
                    onClose={closeSupportModal}
                />
            </InfoCard>
        </>
    )
}

export default SupportInfoCard
