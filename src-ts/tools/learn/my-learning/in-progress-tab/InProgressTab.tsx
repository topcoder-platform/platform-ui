import { FC, ReactNode } from 'react'

import { Button } from '../../../../lib'
import { LearnCertification, MyCourseInProgressCard, UserCertificationInProgress } from '../../learn-lib'
import { LEARN_PATHS } from '../../learn.routes'
import { sortOptions } from '../my-learning-sort-options'
import { MyTabsViews } from '../my-tabs-navbar'
import { TabContentLayout } from '../tab-content-layout'
import { useSortAndFilter, UseSortAndFilterValue } from '../use-sort-and-filter'

import styles from './InProgressTab.module.scss'

interface InProgressTabProps {
    allCertificates: ReadonlyArray<LearnCertification>
    certificatesById: {[key: string]: LearnCertification}
    certifications: ReadonlyArray<UserCertificationInProgress>
}

const InProgressTab: FC<InProgressTabProps> = (props: InProgressTabProps) => {

    const {
        handleCategoryChange,
        certifications,
        handleSortChange,
    }: UseSortAndFilterValue = useSortAndFilter(
        props.allCertificates,
        props.certifications,
    )

    const disableFilters: boolean = props.certifications.length < 1
    const hasCertifications: boolean = certifications.length >= 1

    const renderPlaceholder: () => ReactNode = () => (
        <div className={styles['placeholder-wrap']}>
            <div className='body-medium-bold'>
                Your In Progress courses will live here. Let’s go!
            </div>
            <Button
                route={LEARN_PATHS.root}
                buttonStyle='primary'
                size='md'
                label='Start a course'
            />
        </div>
    )

    const renderCertificationsList: () => ReactNode = () => (
        hasCertifications ? certifications.map(certif => (
            <MyCourseInProgressCard
                certification={props.certificatesById[certif.certificationId]}
                key={certif.certificationId}
                theme='detailed'
                currentLesson={certif.currentLesson}
                completedPercentage={certif.courseProgressPercentage / 100}
                startDate={certif.startDate}
            />
        )) : renderPlaceholder()
    )

    return (
        <TabContentLayout
            certifications={props.allCertificates}
            title={MyTabsViews.inProgress}
            sortOptions={sortOptions.inProgress}
            onSortChange={handleSortChange}
            onCategoryChange={handleCategoryChange}
            disableFilters={disableFilters}
        >
            <div className={styles.wrap}>
                {renderCertificationsList()}
            </div>
        </TabContentLayout>
    )
}

export default InProgressTab
