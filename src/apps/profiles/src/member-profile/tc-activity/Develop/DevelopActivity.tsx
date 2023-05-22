import { FC } from 'react'

import { MemberStats, ratingToCSScolor } from '~/libs/core'
import { Collapsible } from '~/libs/ui'

import { ModalTriggerButton } from '../ModalTriggerButton'

import styles from './DevelopActivity.module.scss'

interface DevelopActivityProps {
    assemblyStats: MemberStats | undefined
    codeStats: MemberStats | undefined
    f2fStats: MemberStats | undefined
    handleShowAssemblyModal: () => void
    handleShowCodeModal: () => void
    handleShowF2FModal: () => void
}

const DevelopActivity: FC<DevelopActivityProps> = (props: DevelopActivityProps) => (
    <Collapsible
        header={<h4>DEVELOPMENT</h4>}
        containerClass={styles.activitySection}
    >
        <div className={styles.contentGrid}>
            {
                props.f2fStats && (
                    <div className={styles.content}>
                        <span>First2Finish</span>
                        <div className={styles.progress}>
                            <div className={styles.progressValue}>
                                {props.f2fStats.wins || 0}
                                {' '}
                                WINS
                            </div>
                            <ModalTriggerButton onClick={props.handleShowF2FModal} />
                        </div>
                    </div>
                )
            }
            {
                props.codeStats && (
                    <div className={styles.content}>
                        <span>Code</span>
                        <div className={styles.progress}>
                            <div
                                className={styles.progressValue}
                                style={ratingToCSScolor(props.codeStats.rank.rating)}
                            >
                                {props.codeStats.rank.rating || 0}
                                {' '}
                                RATING
                            </div>
                            <ModalTriggerButton onClick={props.handleShowCodeModal} />
                        </div>
                    </div>
                )
            }
            {
                props.assemblyStats && (
                    <div className={styles.content}>
                        <span>Assembly Competition</span>
                        <div className={styles.progress}>
                            <div
                                className={styles.progressValue}
                                style={ratingToCSScolor(props.assemblyStats.rank.rating)}
                            >
                                {props.assemblyStats.rank.rating || 0}
                                {' '}
                                RATING
                            </div>
                            <ModalTriggerButton onClick={props.handleShowAssemblyModal} />
                        </div>
                    </div>
                )
            }
        </div>
    </Collapsible>
)

export default DevelopActivity
