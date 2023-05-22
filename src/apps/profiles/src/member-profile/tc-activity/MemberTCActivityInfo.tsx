/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { MemberStats, useMemberStats, UserProfile, UserStats } from '~/libs/core'

import {
    AssemblyDetailsModal,
    BugHuntDetailsModal,
    CodeDetailsModal,
    ContentCreationDetailsModal,
    CopilotDetailsModal,
    F2FDetailsModal,
    MMDetailsModal,
    SRMDetailsModal,
    TestScenariosDetailsModal,
    UIPrototypeDetailsModal,
} from '../../components'

import { DSActivity } from './DS'
import { CopilotActivity } from './Copilot'
import { DevelopActivity } from './Develop'
import { QAActivity } from './QA'
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
    const contentCreationStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CONTENT_CREATION')
    const uiPrototypeStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION')
    const codeStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'CODE')
    const f2fStats: MemberStats | undefined
        = memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'FIRST_2_FINISH')
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
    const [isBugHuntDetailsOpen, setIsBugHuntDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isTestScenDetailsOpen, setIsTestScenDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isContentCreationDetailsOpen, setIsContentCreationDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isUIPrototypeDetailsOpen, setIsUIPrototypeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
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

    function handleShowBugHuntModal(): void {
        setIsBugHuntDetailsOpen(!isBugHuntDetailsOpen)
    }

    function handleShowTestScenModal(): void {
        setIsTestScenDetailsOpen(!isTestScenDetailsOpen)
    }

    function handleShowContentCreationModal(): void {
        setIsContentCreationDetailsOpen(!isContentCreationDetailsOpen)
    }

    function handleShowUIPrototypeModal(): void {
        setIsUIPrototypeDetailsOpen(!isUIPrototypeDetailsOpen)
    }

    return memberStats ? (
        <div className={styles.container}>
            <h3>TC ACTIVITY</h3>

            {
                memberStats?.DEVELOP && (
                    <DevelopActivity
                        activityData={memberStats?.DEVELOP?.subTracks || []}
                        handleShowF2FModal={handleShowF2FModal}
                        handleShowCodeModal={handleShowCodeModal}
                        handleShowAssemblyModal={handleShowAssemblyModal}
                        handleShowContentCreationModal={handleShowContentCreationModal}
                        handleShowUIPrototypeModal={handleShowUIPrototypeModal}
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

            {isContentCreationDetailsOpen && (
                <ContentCreationDetailsModal
                    isContentCreationDetailsOpen={isContentCreationDetailsOpen}
                    onClose={handleShowContentCreationModal}
                    contentCreationStats={contentCreationStats}
                    profile={props.profile}
                />
            )}

            {isUIPrototypeDetailsOpen && (
                <UIPrototypeDetailsModal
                    isUIPrototypeDetailsOpen={isUIPrototypeDetailsOpen}
                    onClose={handleShowUIPrototypeModal}
                    uiPrototypeStats={uiPrototypeStats}
                    profile={props.profile}
                />
            )}

            {isCodeDetailsOpen && (
                <CodeDetailsModal
                    isCodeDetailsOpen={isCodeDetailsOpen}
                    onClose={handleShowCodeModal}
                    codeStats={codeStats}
                    profile={props.profile}
                />
            )}

            {isF2FDetailsOpen && (
                <F2FDetailsModal
                    isF2FDetailsOpen={isF2FDetailsOpen}
                    onClose={handleShowF2FModal}
                    f2fStats={f2fStats}
                />
            )}

            {isAssemblyDetailsOpen && (
                <AssemblyDetailsModal
                    isAssemblyDetailsOpen={isAssemblyDetailsOpen}
                    onClose={handleShowAssemblyModal}
                    assemblyStats={assemblyStats}
                    profile={props.profile}
                />
            )}
        </div>
    ) : <></>
}

export default MemberTCActivityInfo
