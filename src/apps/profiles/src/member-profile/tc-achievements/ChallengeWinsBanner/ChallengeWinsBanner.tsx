/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { bind } from 'lodash'

import { MemberStats, UserProfile, UserStats } from '~/libs/core'

import { subTrackLabelToHumanName } from '../../../lib/helpers'
import {
    AssemblyDetailsModal,
    BugHuntDetailsModal,
    CodeDetailsModal,
    ContentCreationDetailsModal,
    CopilotDetailsModal,
    DesignF2FDetailsModal,
    F2FDetailsModal,
    LogoDesignDetailsModal,
    MMDetailsModal,
    SRMDetailsModal,
    TestScenariosDetailsModal,
    UIPrototypeDetailsModal,
    WebDesignDetailsModal,
} from '../../../components'

import { ChallengeWin } from './ChallengeWin'
import styles from './ChallengeWinsBanner.module.scss'

interface ChallengeWinsBannerProps {
    memberStats: UserStats
    profile: UserProfile
}

const ChallengeWinsBanner: FC<ChallengeWinsBannerProps> = (props: ChallengeWinsBannerProps) => {
    const f2fStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'FIRST_2_FINISH')
    const codeStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'CODE')
    const assemblyStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION')
    const contentCreationStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'CONTENT_CREATION')
    const uiPrototypeStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION')
    const designF2FStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'DESIGN_FIRST_2_FINISH')
    const webDesignStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'WEB_DESIGNS')
    const logoDesignStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'LOGO_DESIGN')
    const bugHuntStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'BUG_HUNT')
    const testScenStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'TEST_SCENARIOS')

    const [isDesignF2FsDetailsOpen, setIsDesignF2FsDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isWebDesignDetailsOpen, setIsWebDesignDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isLogoDesignDetailsOpen, setIsLogoDesignDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isF2FDetailsOpen, setIsF2FDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isCodeDetailsOpen, setIsCodeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isAssemblyDetailsOpen, setIsAssemblyDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isContentCreationDetailsOpen, setIsContentCreationDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isUIPrototypeDetailsOpen, setIsUIPrototypeDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDSDetailsOpen, setIsDSDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)
    const [isSRMDetailsOpen, setIsSRMDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isBugHuntDetailsOpen, setIsBugHuntDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isTestScenDetailsOpen, setIsTestScenDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isCopilotDetailsOpen, setIsCopilotDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    function handleShowDSModal(): void {
        setIsDSDetailsOpen(!isDSDetailsOpen)
    }

    function handleShowSRMModal(): void {
        setIsSRMDetailsOpen(!isSRMDetailsOpen)
    }

    function handleChallengeWinModalToggle(subTrack: string): void {
        switch (subTrack) {
            case 'ASSEMBLY_COMPETITION':
                setIsAssemblyDetailsOpen(!isAssemblyDetailsOpen)
                break
            case 'CODE':
                setIsCodeDetailsOpen(!isCodeDetailsOpen)
                break
            case 'FIRST_2_FINISH':
                setIsF2FDetailsOpen(!isF2FDetailsOpen)
                break
            case 'UI_PROTOTYPE_COMPETITION':
                setIsUIPrototypeDetailsOpen(!isUIPrototypeDetailsOpen)
                break
            case 'DESIGN_FIRST_2_FINISH':
                setIsDesignF2FsDetailsOpen(!isDesignF2FsDetailsOpen)
                break
            case 'WEB_DESIGNS':
                setIsWebDesignDetailsOpen(!isWebDesignDetailsOpen)
                break
            case 'LOGO_DESIGN':
                setIsLogoDesignDetailsOpen(!isLogoDesignDetailsOpen)
                break
            case 'BUG_HUNT':
                setIsBugHuntDetailsOpen(!isBugHuntDetailsOpen)
                break
            case 'TEST_SCENARIOS':
                setIsTestScenDetailsOpen(!isTestScenDetailsOpen)
                break
            case 'CONTENT_CREATION':
                setIsContentCreationDetailsOpen(!isContentCreationDetailsOpen)
                break
            case 'COPILOT':
                setIsCopilotDetailsOpen(!isCopilotDetailsOpen)
                break
            // TODO: modal views for the following subtracks
            // are those all the subtracks?
            // case 'CONCEPTUALIZATION':
            //     return 'Conceptualization'
            // case 'SPECIFICATION':
            //     return 'Specification'
            // case 'TEST_SUITES':
            //     return 'Test Suites'
            // case 'COPILOT_POSTING':
            //     return 'Copilot Posting'
            default: break
        }
    }

    return (
        <div className={styles.containerWrap}>
            <div className={styles.container}>
                <p className='body-large-bold'>Topcoder Challenge Winner</p>
                <div className={styles.wins}>
                    {
                        !!props.memberStats.DATA_SCIENCE?.SRM?.wins && (
                            <ChallengeWin
                                typeName='SRM'
                                onClick={handleShowSRMModal}
                                winCnt={props.memberStats.DATA_SCIENCE.SRM.wins}
                            />
                        )
                    }
                    {
                        !!props.memberStats.DATA_SCIENCE?.MARATHON_MATCH?.wins && (
                            <ChallengeWin
                                typeName='Marathon Match'
                                onClick={handleShowDSModal}
                                winCnt={props.memberStats.DATA_SCIENCE.MARATHON_MATCH.wins}
                            />
                        )
                    }
                    {
                        !!props.memberStats.DEVELOP?.wins
                        && props.memberStats.DEVELOP?.subTracks.map((ms: MemberStats) => (ms.wins ? (
                            <ChallengeWin
                                key={ms.name}
                                typeName={subTrackLabelToHumanName(ms.name)}
                                onClick={bind(handleChallengeWinModalToggle, this, ms.name)}
                                winCnt={ms.wins}
                            />
                        ) : undefined))
                    }
                    {
                        !!props.memberStats.DESIGN?.wins
                        && props.memberStats.DESIGN?.subTracks.map((ms: MemberStats) => (ms.wins ? (
                            <ChallengeWin
                                key={ms.name}
                                typeName={subTrackLabelToHumanName(ms.name)}
                                onClick={bind(handleChallengeWinModalToggle, this, ms.name)}
                                winCnt={ms.wins}
                            />
                        ) : undefined))
                    }
                    {
                        !!props.memberStats.COPILOT && (
                            <ChallengeWin
                                typeName='% Fulfillment'
                                onClick={bind(handleChallengeWinModalToggle, this, 'COPILOT')}
                                winCnt={props.memberStats.COPILOT.fulfillment}
                                winLabel='COPILOT'
                            />
                        )
                    }
                </div>
            </div>
            <p>
                Topcoder challenges are open competitions where community
                members participate in small units of work to deliver projects.
            </p>

            {isSRMDetailsOpen && (
                <SRMDetailsModal
                    isSRMDetailsOpen={isSRMDetailsOpen}
                    onClose={handleShowSRMModal}
                    SRMStats={props.memberStats?.DATA_SCIENCE?.SRM}
                    profile={props.profile}
                />
            )}

            {isDSDetailsOpen && (
                <MMDetailsModal
                    isDSDetailsOpen={isDSDetailsOpen}
                    onClose={handleShowDSModal}
                    MMStats={props.memberStats?.DATA_SCIENCE?.MARATHON_MATCH}
                    profile={props.profile}
                />
            )}

            {isCodeDetailsOpen && (
                <CodeDetailsModal
                    isCodeDetailsOpen={isCodeDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'CODE')}
                    codeStats={codeStats}
                    profile={props.profile}
                />
            )}

            {isF2FDetailsOpen && (
                <F2FDetailsModal
                    isF2FDetailsOpen={isF2FDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'FIRST_2_FINISH')}
                    f2fStats={f2fStats}
                />
            )}

            {isAssemblyDetailsOpen && (
                <AssemblyDetailsModal
                    isAssemblyDetailsOpen={isAssemblyDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'ASSEMBLY_COMPETITION')}
                    assemblyStats={assemblyStats}
                    profile={props.profile}
                />
            )}

            {isContentCreationDetailsOpen && (
                <ContentCreationDetailsModal
                    isContentCreationDetailsOpen={isContentCreationDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'CONTENT_CREATION')}
                    contentCreationStats={contentCreationStats}
                    profile={props.profile}
                />
            )}

            {isUIPrototypeDetailsOpen && (
                <UIPrototypeDetailsModal
                    isUIPrototypeDetailsOpen={isUIPrototypeDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'UI_PROTOTYPE_COMPETITION')}
                    uiPrototypeStats={uiPrototypeStats}
                    profile={props.profile}
                />
            )}

            {isWebDesignDetailsOpen && (
                <WebDesignDetailsModal
                    isWebDesignDetailsOpen={isWebDesignDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'WEB_DESIGNS')}
                    webDesignStats={webDesignStats}
                />
            )}

            {isLogoDesignDetailsOpen && (
                <LogoDesignDetailsModal
                    isLogoDesignDetailsOpen={isLogoDesignDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'LOGO_DESIGN')}
                    logoDesignStats={logoDesignStats}
                />
            )}

            {isDesignF2FsDetailsOpen && (
                <DesignF2FDetailsModal
                    isDesignF2FDetailsOpen={isDesignF2FsDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'DESIGN_FIRST_2_FINISH')}
                    designF2FStats={designF2FStats}
                />
            )}

            {isTestScenDetailsOpen && (
                <TestScenariosDetailsModal
                    isTestScenDetailsOpen={isTestScenDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'TEST_SCENARIOS')}
                    testScenStats={testScenStats}
                    profile={props.profile}
                />
            )}

            {isBugHuntDetailsOpen && (
                <BugHuntDetailsModal
                    isBugHuntDetailsOpen={isBugHuntDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'BUG_HUNT')}
                    bugHuntStats={bugHuntStats}
                />
            )}

            {isCopilotDetailsOpen && (
                <CopilotDetailsModal
                    isCopilotDetailsOpen={isCopilotDetailsOpen}
                    onClose={bind(handleChallengeWinModalToggle, this, 'COPILOT')}
                    copilotDetails={props.memberStats?.COPILOT}
                />
            )}

        </div>
    )
}

export default ChallengeWinsBanner
