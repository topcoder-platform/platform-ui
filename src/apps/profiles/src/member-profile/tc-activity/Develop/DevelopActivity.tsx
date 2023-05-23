/* eslint-disable complexity */
import { Dispatch, FC, SetStateAction, useState } from 'react'

import { MemberStats, ratingToCSScolor, UserProfile } from '~/libs/core'
import { Collapsible } from '~/libs/ui'

import { ModalTriggerButton } from '../ModalTriggerButton'
import {
    AssemblyDetailsModal,
    CodeDetailsModal,
    ContentCreationDetailsModal,
    F2FDetailsModal,
    UIPrototypeDetailsModal,
} from '../../../components'

import styles from './DevelopActivity.module.scss'

interface DevelopActivityProps {
    activityData: MemberStats[]
    profile: UserProfile | undefined
}

const DevelopActivity: FC<DevelopActivityProps> = (props: DevelopActivityProps) => {
    const f2fStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'FIRST_2_FINISH')
    const codeStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'CODE')
    const assemblyStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'ASSEMBLY_COMPETITION')
    const contentCreationStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'CONTENT_CREATION')
    const uiPrototypeStats: MemberStats | undefined
        = props.activityData.find(subTrack => subTrack.name === 'UI_PROTOTYPE_COMPETITION')

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

    function handleShowF2FModal(): void {
        setIsF2FDetailsOpen(!isF2FDetailsOpen)
    }

    function handleShowCodeModal(): void {
        setIsCodeDetailsOpen(!isCodeDetailsOpen)
    }

    function handleShowAssemblyModal(): void {
        setIsAssemblyDetailsOpen(!isAssemblyDetailsOpen)
    }

    function handleShowContentCreationModal(): void {
        setIsContentCreationDetailsOpen(!isContentCreationDetailsOpen)
    }

    function handleShowUIPrototypeModal(): void {
        setIsUIPrototypeDetailsOpen(!isUIPrototypeDetailsOpen)
    }

    return (
        <>
            <Collapsible
                header={<h4>DEVELOPMENT</h4>}
                containerClass={styles.activitySection}
            >
                <div className={styles.contentGrid}>
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
                                    <ModalTriggerButton onClick={handleShowAssemblyModal} />
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
                                    >
                                        {codeStats.wins || 0}
                                        {' '}
                                        WINS
                                    </div>
                                    <ModalTriggerButton onClick={handleShowCodeModal} />
                                </div>
                            </div>
                        )
                    }
                    {
                        contentCreationStats && (
                            <div className={styles.content}>
                                <span>Content Creation</span>
                                <div className={styles.progress}>
                                    <div
                                        className={styles.progressValue}
                                        style={ratingToCSScolor(contentCreationStats.rank.rating)}
                                    >
                                        {contentCreationStats.rank.rating || 0}
                                        {' '}
                                        RATING
                                    </div>
                                    <ModalTriggerButton onClick={handleShowContentCreationModal} />
                                </div>
                            </div>
                        )
                    }
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
                                    <ModalTriggerButton onClick={handleShowF2FModal} />
                                </div>
                            </div>
                        )
                    }
                    {
                        uiPrototypeStats && (
                            <div className={styles.content}>
                                <span>UI Prototype Competition</span>
                                <div className={styles.progress}>
                                    <div
                                        className={styles.progressValue}
                                        style={ratingToCSScolor(uiPrototypeStats.rank.rating)}
                                    >
                                        {uiPrototypeStats.rank.rating || 0}
                                        {' '}
                                        RATING
                                    </div>
                                    <ModalTriggerButton onClick={handleShowUIPrototypeModal} />
                                </div>
                            </div>
                        )
                    }
                </div>
            </Collapsible>

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
        </>
    )
}

export default DevelopActivity
