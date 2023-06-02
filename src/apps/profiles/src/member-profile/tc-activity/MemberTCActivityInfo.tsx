/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { MemberStats, useMemberStats, UserProfile, UserStats } from '~/libs/core'

import {
    BugHuntDetailsModal,
    CopilotDetailsModal,
    MMDetailsModal,
    SRMDetailsModal,
    TestScenariosDetailsModal,
} from '../../components'

import { DSActivity } from './DS'
import { CopilotActivity } from './Copilot'
import { DevelopActivity } from './Develop'
import { QAActivity } from './QA'
import { UXActivity } from './UX'
import styles from './MemberTCActivityInfo.module.scss'

interface MemberTCActivityInfoProps {
    profile: UserProfile | undefined
}

const MemberTCActivityInfo: FC<MemberTCActivityInfoProps> = (props: MemberTCActivityInfoProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile?.handle)
    const srmRating: number = memberStats?.DATA_SCIENCE?.SRM?.rank?.maximumRating || 0
    const mmRating: number = memberStats?.DATA_SCIENCE?.MARATHON_MATCH?.rank?.maximumRating || 0
    const bugHuntStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'BUG_HUNT')
    const testScenStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'TEST_SCENARIOS')

    const [isCopilotDetailsOpen, setIsCopilotDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDSDetailsOpen, setIsDSDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isSRMDetailsOpen, setIsSRMDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isBugHuntDetailsOpen, setIsBugHuntDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isTestScenDetailsOpen, setIsTestScenDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
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

    function handleShowBugHuntModal(): void {
        setIsBugHuntDetailsOpen(!isBugHuntDetailsOpen)
    }

    function handleShowTestScenModal(): void {
        setIsTestScenDetailsOpen(!isTestScenDetailsOpen)
    }

    return memberStats ? (
        <div className={styles.container}>
            <h3>TC ACTIVITY</h3>
            {
                memberStats?.DESIGN && (
                    <UXActivity
                        activityData={memberStats?.DESIGN?.subTracks || []}
                    />
                )
            }
            {
                memberStats?.DEVELOP && (
                    <DevelopActivity
                        activityData={memberStats?.DEVELOP?.subTracks || []}
                        profile={props.profile}
                    />
                )
            }
            {
                memberStats?.DATA_SCIENCE && (
                    <DSActivity
                        mmRating={mmRating}
                        srmRating={srmRating}
                        handleShowSRMModal={handleShowSRMModal}
                        handleShowDSModal={handleShowDSModal}
                    />
                )
            }
            {
                bugHuntStats || testScenStats ? (
                    <QAActivity
                        bugHuntWins={bugHuntStats?.wins}
                        handleShowBugHuntModal={handleShowBugHuntModal}
                        handleShowTestScenModal={handleShowTestScenModal}
                        testScenRating={testScenStats?.rank.rating}
                    />
                ) : <></>
            }
            {
                memberStats?.COPILOT && (
                    <CopilotActivity
                        copilotData={memberStats?.COPILOT}
                        handleShowCopilotModal={handleShowCopilotModal}
                    />
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

            {isTestScenDetailsOpen && (
                <TestScenariosDetailsModal
                    isTestScenDetailsOpen={isTestScenDetailsOpen}
                    onClose={handleShowTestScenModal}
                    testScenStats={testScenStats}
                    profile={props.profile}
                />
            )}

            {isBugHuntDetailsOpen && (
                <BugHuntDetailsModal
                    isBugHuntDetailsOpen={isBugHuntDetailsOpen}
                    onClose={handleShowBugHuntModal}
                    bugHuntStats={bugHuntStats}
                />
            )}
        </div>
    ) : <></>
}

export default MemberTCActivityInfo
