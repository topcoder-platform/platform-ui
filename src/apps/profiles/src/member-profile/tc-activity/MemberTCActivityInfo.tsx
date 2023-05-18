import { Dispatch, FC, SetStateAction, useState } from 'react'

import { ratingToCSScolor, useMemberStats, UserProfile, UserStats } from '~/libs/core'
import { Button, Collapsible } from '~/libs/ui'
import { ChevronRightIcon } from '@heroicons/react/solid'

import { CopilotDetailsModal, SRMDetailsModal } from '../../components'

import styles from './MemberTCActivityInfo.module.scss'

interface MemberTCActivityInfoProps {
    profile: UserProfile | undefined
}

const MemberTCActivityInfo: FC<MemberTCActivityInfoProps> = (props: MemberTCActivityInfoProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)
    const SRMRating: number = memberStats?.DATA_SCIENCE?.SRM?.rank?.maximumRating || 0
    const MMRating: number = memberStats?.DATA_SCIENCE?.MARATHON_MATCH?.rank?.maximumRating || 0

    const [isCopilotDetailsOpen, setIsCopilotDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDSDetailsOpen, setIsDSDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isSRMDetailsOpen, setIsSRMDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleShowCopilotModal(): void {
        setIsCopilotDetailsOpen(!isCopilotDetailsOpen)
    }

    function handleShowDSModal(): void {
        setIsDSDetailsOpen(!isDSDetailsOpen)
    }

    function handleShowSRMModal(): void {
        setIsSRMDetailsOpen(!isSRMDetailsOpen)
    }

    return memberStats ? (
        <div className={styles.container}>
            <h3>TC ACTIVITY</h3>

            {
                memberStats?.DATA_SCIENCE && (
                    <Collapsible
                        header={<h4>DATA SCIENCE</h4>}
                        containerClass={styles.activitySection}
                    >
                        <div className={styles.contentGrid}>
                            <div className={styles.content}>
                                <span>SRM</span>
                                <div className={styles.progress}>
                                    <div className={styles.progressValue} style={ratingToCSScolor(SRMRating)}>
                                        {SRMRating}
                                        {' '}
                                        RATING
                                    </div>
                                    <Button
                                        icon={ChevronRightIcon}
                                        size='lg'
                                        className={styles.btn}
                                        onClick={handleShowSRMModal}
                                    />
                                </div>
                            </div>
                            <div className={styles.content}>
                                <span>Marathon Match</span>
                                <div className={styles.progress}>
                                    <div className={styles.progressValue} style={ratingToCSScolor(MMRating)}>
                                        {MMRating || 'NO'}
                                        {' '}
                                        RATING
                                    </div>
                                    <Button
                                        icon={ChevronRightIcon}
                                        size='lg'
                                        className={styles.btn}
                                        onClick={handleShowDSModal}
                                    />
                                </div>
                            </div>
                        </div>
                    </Collapsible>
                )
            }

            {
                memberStats?.COPILOT && (
                    <Collapsible header={<h4>SPECIALIZED ROLES</h4>}>
                        <div className={styles.content}>
                            <span>Copilot</span>
                            <div className={styles.progress}>
                                <div className={styles.progressValue}>
                                    {memberStats?.COPILOT.fulfillment}
                                    % FULFILLMENT
                                </div>
                                <Button
                                    icon={ChevronRightIcon}
                                    size='lg'
                                    className={styles.btn}
                                    onClick={handleShowCopilotModal}
                                />
                            </div>
                        </div>
                    </Collapsible>
                )
            }

            {isSRMDetailsOpen && (
                <SRMDetailsModal
                    isSRMDetailsOpen={isSRMDetailsOpen}
                    onClose={handleShowSRMModal}
                    SRMStats={memberStats?.DATA_SCIENCE?.SRM}
                    profile={props.profile}
                />
            )}

            {isCopilotDetailsOpen && (
                <CopilotDetailsModal
                    isCopilotDetailsOpen={isCopilotDetailsOpen}
                    onClose={handleShowCopilotModal}
                    copilotDetails={memberStats?.COPILOT}
                />
            )}
        </div>
    ) : <></>
}

export default MemberTCActivityInfo
