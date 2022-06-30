import { FC } from 'react'

import { ContentLayout, Portal } from '../../../lib'
import {
    LearningHat,
    MyCertificationsProviderData,
    MyCourseCompletedCard,
    MyCourseInProgressCard,
    useMyCertifications,
    WaveHero
} from '../learn-lib'

import { HeroCard } from './hero-card'
import styles from './MyLearning.module.scss'

interface MyLearningProps {
}

const MyLearning: FC<MyLearningProps> = (props: MyLearningProps) => {
    const { completed, inProgress }: MyCertificationsProviderData = useMyCertifications()

    return (
        <ContentLayout contentClass={styles['content-layout']}>
            <div className={styles['wrap']}>
                <Portal portalId='page-subheader-portal-el'>
                    <WaveHero
                        title='my learning'
                        text={`
                            This is your very own page to keep track of your professional education and skill building.
                            From here you can resume your courses in progress or review past accomplishments.
                        `}
                    >
                        <HeroCard />
                    </WaveHero>
                </Portal>

                <div className={styles['courses-area']}>
                    {inProgress.map((certif) => (
                        <MyCourseInProgressCard
                            certification={certif}
                            key={certif.key}
                            progress={certif.progress}
                            theme='detailed'
                        />
                    ))}
                </div>

                <div className={styles['courses-area']}>
                    {!!completed.length && (
                        <div className={styles['title-line']}>
                            <LearningHat />
                            <h2 className='details'>Completed Courses</h2>
                        </div>
                    )}

                    <div className={styles['cards-wrap']}>
                        {completed.map((certif) => (
                            <MyCourseCompletedCard
                                certification={certif}
                                key={certif.key}
                                completed={certif.progress.completedDate!}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </ContentLayout>
    )
}

export default MyLearning
