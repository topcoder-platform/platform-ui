import { Dispatch, FC, SetStateAction, useState } from 'react'

import { Collapsible } from '~/libs/ui'
import { MemberStats } from '~/libs/core'

import { ModalTriggerButton } from '../ModalTriggerButton'
import { DesignF2FDetailsModal, LogoDesignDetailsModal, WebDesignDetailsModal } from '../../../components'

import styles from './UXActivity.module.scss'

interface UXActivityProps {
    activityData: MemberStats[]
}

const UXActivity: FC<UXActivityProps> = (props: UXActivityProps) => {
    const designF2FStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'DESIGN_FIRST_2_FINISH')
    const webDesignStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'WEB_DESIGNS')
    const logoDesignStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'LOGO_DESIGN')

    const [isDesignF2FsDetailsOpen, setIsDesignF2FsDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isWebDesignDetailsOpen, setIsWebDesignDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isLogoDesignDetailsOpen, setIsLogoDesignDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleShowDesignF2FsModal(): void {
        setIsDesignF2FsDetailsOpen(!isDesignF2FsDetailsOpen)
    }

    function handleShowWebDesignModal(): void {
        setIsWebDesignDetailsOpen(!isWebDesignDetailsOpen)
    }

    function handleShowLogoDesignModal(): void {
        setIsLogoDesignDetailsOpen(!isLogoDesignDetailsOpen)
    }

    return (
        <>
            <Collapsible
                header={<h4>UX / UI DESIGN</h4>}
                containerClass={styles.activitySection}
            >
                <div className={styles.contentGrid}>
                    {
                        designF2FStats && (
                            <div className={styles.content}>
                                <span>Design First2Finish</span>
                                <div className={styles.progress}>
                                    <div className={styles.progressValue}>
                                        {designF2FStats?.wins || 0}
                                        {' '}
                                        WINS
                                    </div>
                                    <ModalTriggerButton onClick={handleShowDesignF2FsModal} />
                                </div>
                            </div>
                        )
                    }
                    {
                        logoDesignStats && (
                            <div className={styles.content}>
                                <span>Logo Design</span>
                                <div className={styles.progress}>
                                    <div className={styles.progressValue}>
                                        {logoDesignStats?.wins || 0}
                                        {' '}
                                        WINS
                                    </div>
                                    <ModalTriggerButton onClick={handleShowLogoDesignModal} />
                                </div>
                            </div>
                        )
                    }
                    {
                        webDesignStats && (
                            <div className={styles.content}>
                                <span>Web Designs</span>
                                <div className={styles.progress}>
                                    <div className={styles.progressValue}>
                                        {webDesignStats?.wins || 0}
                                        {' '}
                                        WINS
                                    </div>
                                    <ModalTriggerButton onClick={handleShowWebDesignModal} />
                                </div>
                            </div>
                        )
                    }
                </div>
            </Collapsible>

            {isWebDesignDetailsOpen && (
                <WebDesignDetailsModal
                    isWebDesignDetailsOpen={isWebDesignDetailsOpen}
                    onClose={handleShowWebDesignModal}
                    webDesignStats={webDesignStats}
                />
            )}

            {isLogoDesignDetailsOpen && (
                <LogoDesignDetailsModal
                    isLogoDesignDetailsOpen={isLogoDesignDetailsOpen}
                    onClose={handleShowLogoDesignModal}
                    logoDesignStats={logoDesignStats}
                />
            )}

            {isDesignF2FsDetailsOpen && (
                <DesignF2FDetailsModal
                    isDesignF2FDetailsOpen={isDesignF2FsDetailsOpen}
                    onClose={handleShowDesignF2FsModal}
                    designF2FStats={designF2FStats}
                />
            )}
        </>
    )
}

export default UXActivity
