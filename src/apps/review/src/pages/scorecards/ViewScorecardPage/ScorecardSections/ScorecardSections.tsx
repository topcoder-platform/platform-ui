import { FC } from 'react'
import { ScorecardSection } from '~/apps/review/src/lib/models'
import cn from 'classnames'
import styles from './ScorecardSections.module.scss'

interface ScorecardSectionsProps {
    sections: ScorecardSection[]
}

const ScorecardSections: FC<ScorecardSectionsProps> = ({ sections }) => (
    <div className={styles.container}>
        {
            sections.map((section, sectionIndex) => (
                <div key={section.id} className={styles.section}>
                    <div className={styles.heading}>
                        <div>{`Section ${sectionIndex + 1}`}</div>
                        <div className={styles.sectionInfo}>
                            <div className={styles.name}>{section.name}</div>
                            <div>{section.weight}</div>
                        </div>
                    </div>
                    <div className={styles.questions}>
                        {
                            section.questions.map((question, index) => (
                                <div className={cn(styles.question, {
                                    [styles.notLast]: index + 1 !== section.questions.length,
                                })}
                                >
                                    <div className={styles.left}>
                                        <div className={styles.description}>{`${sectionIndex + 1}.${index + 1} ${question.description}`}</div>
                                        <div className={styles.detailItemsWrapper}>
                                            <div className={styles.detailItem}>
                                                <div className={styles.label}>Guidelines:</div>
                                                <div className={styles.value}>{question.guidelines}</div>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <div className={styles.label}>Scale:</div>
                                                <div className={styles.value}>{`Scale ${question.scaleMin} - ${question.scaleMax}`}</div>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <div className={styles.label}>Document Upload:</div>
                                                {/* This will be added once upload functionality works */}
                                                <div className={styles.value}>NA</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.right}>
                                        <div>{question.weight}</div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            ))
        }
    </div>
)

export default ScorecardSections
