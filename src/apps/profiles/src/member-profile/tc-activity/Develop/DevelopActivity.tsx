import { FC } from 'react'

import { MemberStats, ratingToCSScolor } from '~/libs/core'
import { Collapsible } from '~/libs/ui'

import { ModalTriggerButton } from '../ModalTriggerButton'

import styles from './DevelopActivity.module.scss'

interface DevelopActivityProps {
    activityData: MemberStats[]
    handleShowAssemblyModal: () => void
    handleShowCodeModal: () => void
    handleShowF2FModal: () => void
    handleShowUIPrototypeModal: () => void
    handleShowContentCreationModal: () => void
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

    return (
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
                                <ModalTriggerButton onClick={props.handleShowAssemblyModal} />
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
                                <ModalTriggerButton onClick={props.handleShowCodeModal} />
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
                                <ModalTriggerButton onClick={props.handleShowContentCreationModal} />
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
                                <ModalTriggerButton onClick={props.handleShowF2FModal} />
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
                                <ModalTriggerButton onClick={props.handleShowUIPrototypeModal} />
                            </div>
                        </div>
                    )
                }
            </div>
        </Collapsible>
    )
}

export default DevelopActivity
