/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { MemberStats, ratingToCSScolor, useMemberStats, UserProfile, UserStats } from '~/libs/core'
import { Button, Collapsible } from '~/libs/ui'
import { ChevronRightIcon } from '@heroicons/react/solid'

import { CopilotDetailsModal, MMDetailsModal, SRMDetailsModal } from '../../components'

import styles from './MemberTCActivityInfo.module.scss'

interface MemberTCActivityInfoProps {
    profile: UserProfile | undefined
}

const MemberTCActivityInfo: FC<MemberTCActivityInfoProps> = (props: MemberTCActivityInfoProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)
    const srmRating: number = memberStats?.DATA_SCIENCE?.SRM?.rank?.maximumRating || 0
    const mmRating: number = memberStats?.DATA_SCIENCE?.MARATHON_MATCH?.rank?.maximumRating || 0
    const f2fStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'FIRST_2_FINISH')
    const codeStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CODE')
    const assemblyStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION')

    const [isCopilotDetailsOpen, setIsCopilotDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDSDetailsOpen, setIsDSDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isSRMDetailsOpen, setIsSRMDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isF2FDetailsOpen, setIsF2FDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isCodeDetailsOpen, setIsCodeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isAssemblyDetailsOpen, setIsAssemblyDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
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

    function handleShowF2FModal(): void {
        setIsF2FDetailsOpen(!isF2FDetailsOpen)
    }

    function handleShowCodeModal(): void {
        setIsCodeDetailsOpen(!isCodeDetailsOpen)
    }

    function handleShowAssemblyModal(): void {
        setIsAssemblyDetailsOpen(!isAssemblyDetailsOpen)
    }

    return memberStats ? (
        <div className={styles.container}>
            <h3>TC ACTIVITY</h3>

            {
                memberStats?.DEVELOP && (
                    <Collapsible
                        header={<h4>DEVELOPMENT</h4>}
                        containerClass={styles.activitySection}
                    >
                        <div className={styles.contentGrid}>
                            {
                                f2fStats && (
                                    <div className={styles.content}>
                                        <span>First2Finish</span>
                                        <div className={styles.progress}>
                                            <div className={styles.progressValue}>
                                                {f2fStats.wins || 0}
                                                {' '}
                                                WINS
                                            </div>
                                            <Button
                                                icon={ChevronRightIcon}
                                                size='lg'
                                                className={styles.btn}
                                                onClick={handleShowF2FModal}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                            {
                                codeStats && (
                                    <div className={styles.content}>
                                        <span>Code</span>
                                        <div className={styles.progress}>
                                            <div
                                                className={styles.progressValue}
                                                style={ratingToCSScolor(codeStats.rank.rating)}
                                            >
                                                {codeStats.rank.rating || 0}
                                                {' '}
                                                RATING
                                            </div>
                                            <Button
                                                icon={ChevronRightIcon}
                                                size='lg'
                                                className={styles.btn}
                                                onClick={handleShowCodeModal}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                            {
                                assemblyStats && (
                                    <div className={styles.content}>
                                        <span>Assembly Competition</span>
                                        <div className={styles.progress}>
                                            <div
                                                className={styles.progressValue}
                                                style={ratingToCSScolor(assemblyStats.rank.rating)}
                                            >
                                                {assemblyStats.rank.rating || 0}
                                                {' '}
                                                RATING
                                            </div>
                                            <Button
                                                icon={ChevronRightIcon}
                                                size='lg'
                                                className={styles.btn}
                                                onClick={handleShowAssemblyModal}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </Collapsible>
                )
            }

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
                                    <div className={styles.progressValue} style={ratingToCSScolor(srmRating)}>
                                        {srmRating}
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
                                    <div className={styles.progressValue} style={ratingToCSScolor(mmRating)}>
                                        {mmRating || 'NO'}
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

            {isDSDetailsOpen && (
                <MMDetailsModal
                    isDSDetailsOpen={isDSDetailsOpen}
                    onClose={handleShowDSModal}
                    MMStats={memberStats?.DATA_SCIENCE?.MARATHON_MATCH}
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
