/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
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
    GenericSubtrackDetailsModal,
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
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'FIRST_2_FINISH'),
            [props.memberStats],
        )
    const codeStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'CODE'),
            [props.memberStats],
        )
    const assemblyStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION'),
            [props.memberStats],
        )
    const contentCreationStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'CONTENT_CREATION'),
            [props.memberStats],
        )
    const uiPrototypeStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION'),
            [props.memberStats],
        )
    const designF2FStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'DESIGN_FIRST_2_FINISH'),
            [props.memberStats],
        )
    const webDesignStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'WEB_DESIGNS'),
            [props.memberStats],
        )
    const logoDesignStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'LOGO_DESIGN'),
            [props.memberStats],
        )
    const bugHuntStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'BUG_HUNT'),
            [props.memberStats],
        )
    const testScenStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks?.find(subTrack => subTrack.name === 'TEST_SCENARIOS'),
            [props.memberStats],
        )
    const wireframesStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'WIREFRAMES'),
            [props.memberStats],
        )
    const frontEndFlashStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'FRONT_END_FLASH'),
            [props.memberStats],
        )
    const printPresentationStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'PRINT_OR_PRESENTATION'),
            [props.memberStats],
        )
    const studioOtherStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'STUDIO_OTHER'),
            [props.memberStats],
        )
    const feDesignStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks
                .find(subTrack => subTrack.name === 'APPLICATION_FRONT_END_DESIGN'),
            [props.memberStats],
        )
    const bannersIconsStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks.find(subTrack => subTrack.name === 'BANNERS_OR_ICONS'),
            [props.memberStats],
        )
    const widgetMobileStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DESIGN?.subTracks
                .find(subTrack => subTrack.name === 'WIDGET_OR_MOBILE_SCREEN_DESIGN'),
            [props.memberStats],
        )
    const testSuitesStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'TEST_SUITES'),
            [props.memberStats],
        )
    const specStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'SPECIFICATION'),
            [props.memberStats],
        )
    const developmentStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'DEVELOPMENT'),
            [props.memberStats],
        )
    const architectureStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'ARCHITECTURE'),
            [props.memberStats],
        )
    const copilotPostingStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'COPILOT_POSTING'),
            [props.memberStats],
        )
    const designStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'DESIGN'),
            [props.memberStats],
        )
    const conceptStats: MemberStats | undefined
        = useMemo(
            () => props.memberStats?.DEVELOP?.subTracks.find(subTrack => subTrack.name === 'CONCEPTUALIZATION'),
            [props.memberStats],
        )

    const [modalVisibilityMap, setModalVisibilityMap]: [
        { [key: string]: boolean },
        Dispatch<SetStateAction<{ [key: string]: boolean }>>
    ] = useState<{ [key: string]: boolean }>({
        APPLICATION_FRONT_END_DESIGN: false,
        ARCHITECTURE: false,
        ASSEMBLY_COMPETITION: false,
        BANNERS_OR_ICONS: false,
        BUG_HUNT: false,
        CODE: false,
        CONCEPTUALIZATION: false,
        CONTENT_CREATION: false,
        COPILOT: false,
        COPILOT_POSTING: false,
        DESIGN: false,
        DESIGN_FIRST_2_FINISH: false,
        DEVELOPMENT: false,
        DS: false,
        FIRST_2_FINISH: false,
        FRONT_END_FLASH: false,
        LOGO_DESIGN: false,
        PRINT_OR_PRESENTATION: false,
        SPECIFICATION: false,
        SRM: false,
        STUDIO_OTHER: false,
        TEST_SCENARIOS: false,
        TEST_SUITES: false,
        UI_PROTOTYPE_COMPETITION: false,
        WEB_DESIGNS: false,
        WIDGET_OR_MOBILE_SCREEN_DESIGN: false,
        WIREFRAMES: false,
    })

    function handleChallengeWinModalToggle(subTrack: string): void {
        setModalVisibilityMap({
            ...modalVisibilityMap,
            [subTrack]: !modalVisibilityMap[subTrack],
        })
    }

    return (
        <div className={styles.containerWrap}>
            <div className={styles.container}>
                <div className={styles.innerWrapper}>
                    <p className='body-large-bold'>Topcoder Challenge Winner</p>
                    <div className={styles.wins}>
                        {
                            !!(props.memberStats.DATA_SCIENCE?.SRM?.wins
                                || props.memberStats.DATA_SCIENCE?.SRM?.rank?.rating) && (
                                <ChallengeWin
                                    typeName='SRM'
                                    onClick={bind(handleChallengeWinModalToggle, this, 'SRM')}
                                    winCnt={Number(props.memberStats.DATA_SCIENCE?.SRM?.wins
                                        || props.memberStats.DATA_SCIENCE?.SRM?.rank?.rating)}
                                    winLabel={!props.memberStats.DATA_SCIENCE?.SRM?.wins ? 'RATING' : 'WINS'}
                                />
                            )
                        }
                        {
                            !!props.memberStats.DATA_SCIENCE?.MARATHON_MATCH?.wins && (
                                <ChallengeWin
                                    typeName='Marathon Match'
                                    onClick={bind(handleChallengeWinModalToggle, this, 'DS')}
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

            {modalVisibilityMap.SRM && (
                <SRMDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'SRM')}
                    SRMStats={props.memberStats?.DATA_SCIENCE?.SRM}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.DS && (
                <MMDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'DS')}
                    MMStats={props.memberStats?.DATA_SCIENCE?.MARATHON_MATCH}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.CODE && (
                <CodeDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'CODE')}
                    codeStats={codeStats}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.FIRST_2_FINISH && (
                <F2FDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'FIRST_2_FINISH')}
                    f2fStats={f2fStats}
                />
            )}

            {modalVisibilityMap.ASSEMBLY_COMPETITION && (
                <AssemblyDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'ASSEMBLY_COMPETITION')}
                    assemblyStats={assemblyStats}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.CONTENT_CREATION && (
                <ContentCreationDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'CONTENT_CREATION')}
                    contentCreationStats={contentCreationStats}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.UI_PROTOTYPE_COMPETITION && (
                <UIPrototypeDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'UI_PROTOTYPE_COMPETITION')}
                    uiPrototypeStats={uiPrototypeStats}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.WEB_DESIGNS && (
                <WebDesignDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'WEB_DESIGNS')}
                    webDesignStats={webDesignStats}
                />
            )}

            {modalVisibilityMap.LOGO_DESIGN && (
                <LogoDesignDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'LOGO_DESIGN')}
                    logoDesignStats={logoDesignStats}
                />
            )}

            {modalVisibilityMap.DESIGN_FIRST_2_FINISH && (
                <DesignF2FDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'DESIGN_FIRST_2_FINISH')}
                    designF2FStats={designF2FStats}
                />
            )}

            {modalVisibilityMap.TEST_SCENARIOS && (
                <TestScenariosDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'TEST_SCENARIOS')}
                    testScenStats={testScenStats}
                    profile={props.profile}
                />
            )}

            {modalVisibilityMap.BUG_HUNT && (
                <BugHuntDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'BUG_HUNT')}
                    bugHuntStats={bugHuntStats}
                />
            )}

            {modalVisibilityMap.COPILOT && (
                <CopilotDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'COPILOT')}
                    copilotDetails={props.memberStats?.COPILOT}
                />
            )}

            {modalVisibilityMap.WIREFRAMES && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'WIREFRAMES')}
                    genericStats={wireframesStats}
                    title='Wireframes'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='WIREFRAMES'
                    chartTitle='Wireframes Rating'
                />
            )}

            {modalVisibilityMap.FRONT_END_FLASH && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'FRONT_END_FLASH')}
                    genericStats={frontEndFlashStats}
                    title='Front End Flash'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='FRONT_END_FLASH'
                    chartTitle='Front End Flash Rating'
                />
            )}

            {modalVisibilityMap.PRINT_OR_PRESENTATION && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'PRINT_OR_PRESENTATION')}
                    genericStats={printPresentationStats}
                    title='Print or Presentation'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='PRINT_OR_PRESENTATION'
                    chartTitle='Print or Presentation Rating'
                />
            )}

            {modalVisibilityMap.STUDIO_OTHER && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'STUDIO_OTHER')}
                    genericStats={studioOtherStats}
                    title='Studio Other'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='STUDIO_OTHER'
                    chartTitle='Studio Rating'
                />
            )}

            {modalVisibilityMap.APPLICATION_FRONT_END_DESIGN && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'APPLICATION_FRONT_END_DESIGN')}
                    genericStats={feDesignStats}
                    title='Application Front End Design'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='APPLICATION_FRONT_END_DESIGN'
                    chartTitle='Application Front End Design Rating'
                />
            )}

            {modalVisibilityMap.BANNERS_OR_ICONS && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'BANNERS_OR_ICONS')}
                    genericStats={bannersIconsStats}
                    title='Banners or Icons'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='BANNERS_OR_ICONS'
                    chartTitle='Banners or Icons Rating'
                />
            )}

            {modalVisibilityMap.WIDGET_OR_MOBILE_SCREEN_DESIGN && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'WIDGET_OR_MOBILE_SCREEN_DESIGN')}
                    genericStats={widgetMobileStats}
                    title='Widget or Mobile Screen Design'
                    profile={props.profile}
                    track='DESIGN'
                    subTrack='WIDGET_OR_MOBILE_SCREEN_DESIGN'
                    chartTitle='Widget or Mobile Screen Design Rating'
                />
            )}

            {modalVisibilityMap.TEST_SUITES && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'TEST_SUITES')}
                    genericStats={testSuitesStats}
                    title='Test Suites'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='TEST_SUITES'
                    chartTitle='Test Suites Rating'
                />
            )}

            {modalVisibilityMap.SPECIFICATION && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'SPECIFICATION')}
                    genericStats={specStats}
                    title='Specification'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='SPECIFICATION'
                    chartTitle='Specification Rating'
                />
            )}

            {modalVisibilityMap.DEVELOPMENT && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'DEVELOPMENT')}
                    genericStats={developmentStats}
                    title='Development'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='DEVELOPMENT'
                    chartTitle='Development Rating'
                />
            )}

            {modalVisibilityMap.ARCHITECTURE && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'ARCHITECTURE')}
                    genericStats={architectureStats}
                    title='Architecture'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='ARCHITECTURE'
                    chartTitle='Architecture Rating'
                />
            )}

            {modalVisibilityMap.COPILOT_POSTING && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'COPILOT_POSTING')}
                    genericStats={copilotPostingStats}
                    title='Copilot Posting'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='COPILOT_POSTING'
                    chartTitle='Copilot Posting Rating'
                />
            )}

            {modalVisibilityMap.DESIGN && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'DESIGN')}
                    genericStats={designStats}
                    title='Design'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='DESIGN'
                    chartTitle='Design Rating'
                />
            )}

            {modalVisibilityMap.CONCEPTUALIZATION && (
                <GenericSubtrackDetailsModal
                    onClose={bind(handleChallengeWinModalToggle, this, 'CONCEPTUALIZATION')}
                    genericStats={conceptStats}
                    title='Conceptualization'
                    profile={props.profile}
                    track='DEVELOP'
                    subTrack='CONCEPTUALIZATION'
                    chartTitle='Conceptualization Rating'
                />
            )}

        </div>
    )
}

export default ChallengeWinsBanner
