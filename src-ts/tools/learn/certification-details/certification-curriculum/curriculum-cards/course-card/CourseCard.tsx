import { FC } from 'react'

import { Button, IconSolid } from '../../../../../../lib'
import { LearnCertification, LearnLevelIcon } from '../../../../learn-lib'
import { ProvidersLogoList } from '../../../providers-logo-list'
import CurriculumCard from '../CurriculumCard'

import styles from './CourseCard.module.scss'

interface CourseCardProps {
    certification: LearnCertification
}

const CourseCard: FC<CourseCardProps> = (props: CourseCardProps) => (
    <CurriculumCard
        bradgeTrackType={props.certification.trackType ?? 'DEV'}
        title={props.certification.title ?? 'Responsive Web Design Certification'}
        cta={(
            <Button
                buttonStyle='primary'
                size='xs'
                label='View Certificate'
            />
        )}
        content={(
            <>
                <ul className={styles.stats}>
                    <li className={styles.stat}>
                        <span className={styles.icon}>
                            <LearnLevelIcon level='Beginner' />
                        </span>
                        <span className='quote-small'>Beginner</span>
                    </li>
                    <li className={styles.stat}>
                        <span className={styles.icon}>
                            <IconSolid.DocumentTextIcon />
                        </span>
                        <span className='quote-small'>4 modules</span>
                    </li>
                    <li className={styles.stat}>
                        <span className={styles.icon}>
                            <IconSolid.ClockIcon />
                        </span>
                        <span className='quote-small'>2 weeks</span>
                    </li>
                </ul>
                <ProvidersLogoList
                    className={styles.providers}
                    label='by'
                    providers={['freecodecamp']}
                />
            </>
        )}
    />
)

export default CourseCard
