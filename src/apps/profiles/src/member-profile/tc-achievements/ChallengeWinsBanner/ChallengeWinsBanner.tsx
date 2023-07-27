/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { bind } from 'lodash'

import { MemberStats, UserProfile, UserStats } from '~/libs/core'

import { subTrackLabelToHumanName } from '../../../lib/helpers'
import {
    AssemblyDetailsModal,
    BannersIconsDetailsModal,
    BugHuntDetailsModal,
    CodeDetailsModal,
    ContentCreationDetailsModal,
    CopilotDetailsModal,
    DesignF2FDetailsModal,
    DevelopmentDetailsModal,
    F2FDetailsModal,
    FEDesignDetailsModal,
    FrontEndFlashDetailsModal,
    LogoDesignDetailsModal,
    MMDetailsModal,
    PrintPresentationDetailsModal,
    SpecificationDetailsModal,
    SRMDetailsModal,
    StudioOtherDetailsModal,
    TestScenariosDetailsModal,
    TestSuitesDetailsModal,
    UIPrototypeDetailsModal,
    WebDesignDetailsModal,
    WidgetMobileScreenDetailsModal,
    WireframesDetailsModal,
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
    const wireframesStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'WIREFRAMES')
    const frontEndFlashStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'FRONT_END_FLASH')
    const printPresentationStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'PRINT_OR_PRESENTATION')
    const studioOtherStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'STUDIO_OTHER')
    const feDesignStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'APPLICATION_FRONT_END_DESIGN')
    const bannersIconsStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'BANNERS_OR_ICONS')
    const widgetMobileStats: MemberStats | undefined
        = props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'WIDGET_OR_MOBILE_SCREEN_DESIGN')
    const testSuitesStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'TEST_SUITES')
    const specStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'SPECIFICATION')
    const developmentStats: MemberStats | undefined
        = props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'DEVELOPMENT')

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
    const [isWireframesDetailsOpen, setIsWireframesDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isFrontEndFlashDetailsOpen, setIsFrontEndFlashDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isPrintPresentationDetailsOpen, setIsPrintPresentationDetailsOpen]: [
        boolean, Dispatch<SetStateAction<boolean>>
    ] = useState<boolean>(false)
    const [isStudioOtherDetailsOpen, setIsStudioOtherDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isFEDesignDetailsOpen, setIsFEDesignDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isBannersIconsDetailsOpen, setisBannersIconsDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isWidgetMobileDetailsOpen, setIsWidgetMobileDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isTestSuitesDetailsOpen, setIsTestSuitesDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isSpecificationDetailsOpen, setIsSpecificationDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)
    const [isDevelopmentDetailsOpen, setIsDevelopmentDetailsOpen]: [boolean, Dispatch<SetStateAction<boolean>>]
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
            case 'WIREFRAMES':
                setIsWireframesDetailsOpen(!isWireframesDetailsOpen)
                break
            case 'FRONT_END_FLASH':
                setIsFrontEndFlashDetailsOpen(!isFrontEndFlashDetailsOpen)
                break
            case 'PRINT_OR_PRESENTATION':
                setIsPrintPresentationDetailsOpen(!isPrintPresentationDetailsOpen)
                break
            case 'STUDIO_OTHER':
                setIsStudioOtherDetailsOpen(!isStudioOtherDetailsOpen)
                break
            case 'APPLICATION_FRONT_END_DESIGN':
                setIsFEDesignDetailsOpen(!isFEDesignDetailsOpen)
                break
            case 'BANNERS_OR_ICONS':
                setisBannersIconsDetailsOpen(!isBannersIconsDetailsOpen)
                break
            case 'WIDGET_OR_MOBILE_SCREEN_DESIGN':
                setIsWidgetMobileDetailsOpen(!isWidgetMobileDetailsOpen)
                break
            case 'TEST_SUITES':
                setIsTestSuitesDetailsOpen(!isTestSuitesDetailsOpen)
                break
            case 'SPECIFICATION':
                setIsSpecificationDetailsOpen(!isSpecificationDetailsOpen)
                break
            case 'DEVELOPMENT':
                setIsDevelopmentDetailsOpen(!isDevelopmentDetailsOpen)
                break
            // TODO: modal views for the following subtracks
            // are those all the subtracks?
            // case 'CONCEPTUALIZATION':
            //     return 'Conceptualization'
            // case 'COPILOT_POSTING':
            //     return 'Copilot Posting'
            default: break
        }
    }

    return (
        <div className={styles.containerWrap}>
            <div className={styles.container}>
                <div className={styles.innerWrapper}>
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
                    <p>
                        Topcoder challenges are open competitions where community
                        members participate in small units of work to deliver projects.
                    </p>
                </div>
            </div>

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

            {isWireframesDetailsOpen && (
                <WireframesDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'WIREFRAMES')}
                    wireframesStats={wireframesStats}
                />
            )}

            {isFrontEndFlashDetailsOpen && (
                <FrontEndFlashDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'FRONT_END_FLASH')}
                    froneEndFlashStats={frontEndFlashStats}
                />
            )}

            {isPrintPresentationDetailsOpen && (
                <PrintPresentationDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'PRINT_OR_PRESENTATION')}
                    printPresentationStats={printPresentationStats}
                />
            )}

            {isStudioOtherDetailsOpen && (
                <StudioOtherDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'STUDIO_OTHER')}
                    studioOtherStats={studioOtherStats}
                />
            )}

            {isFEDesignDetailsOpen && (
                <FEDesignDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'APPLICATION_FRONT_END_DESIGN')}
                    feDesignStats={feDesignStats}
                />
            )}

            {isBannersIconsDetailsOpen && (
                <BannersIconsDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'BANNERS_OR_ICONS')}
                    bannersIconsStats={bannersIconsStats}
                />
            )}

            {isWidgetMobileDetailsOpen && (
                <WidgetMobileScreenDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'WIDGET_OR_MOBILE_SCREEN_DESIGN')}
                    widgetMobileStats={widgetMobileStats}
                />
            )}

            {isTestSuitesDetailsOpen && (
                <TestSuitesDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'TEST_SUITES')}
                    testSuitesStats={testSuitesStats}
                />
            )}

            {isSpecificationDetailsOpen && (
                <SpecificationDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'SPECIFICATION')}
                    specStats={specStats}
                />
            )}

            {isDevelopmentDetailsOpen && (
                <DevelopmentDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'DEVELOPMENT')}
                    developmentStats={developmentStats}
                />
            )}

        </div>
    )
}

export default ChallengeWinsBanner
