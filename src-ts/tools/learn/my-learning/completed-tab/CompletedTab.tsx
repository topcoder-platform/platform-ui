import { FC, ReactNode } from 'react'

import { Button } from '../../../../lib'
import { LearnCertification, MyCourseCompletedCard, UserCertificationCompleted } from '../../learn-lib'
import { LEARN_PATHS } from '../../learn.routes'
import { sortOptions } from '../my-learning-sort-options'
import { MyTabsViews } from '../my-tabs-navbar'
import { TabContentLayout } from '../tab-content-layout'
import { useSortAndFilter, UseSortAndFilterValue } from '../use-sort-and-filter'

import styles from './CompletedTab.module.scss'

interface CompletedTabProps {
    allCertificates: ReadonlyArray<LearnCertification>
    certificatesById: {[key: string]: LearnCertification}
    certifications: ReadonlyArray<UserCertificationCompleted>
}

const CompletedTab: FC<CompletedTabProps> = (props: CompletedTabProps) => {

    const {
        handleCategoryChange,
        certifications,
        handleSortChange,
    }: UseSortAndFilterValue = useSortAndFilter(
        props.allCertificates,
        props.certifications
    )

    const disableFilters: boolean = props.certifications.length < 1
    const hasCertifications: boolean = certifications.length >= 1

    const renderPlaceholder: () => ReactNode = () => (
        <div className={styles['placeholder-wrap']}>
            <div className='body-medium-bold'>
                Your Completed courses will live here. Let’s go!
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
        hasCertifications ? certifications.map((certif) => (
            <MyCourseCompletedCard
                certification={props.certificatesById[certif.certificationId]}
                key={certif.certificationId}
                completed={certif.completedDate}
            />
        )) : renderPlaceholder()
    )

    return (
        <TabContentLayout
            certifications={props.allCertificates}
            title={MyTabsViews.completed}
            sortOptions={sortOptions.completed}
            onSortChange={handleSortChange}
            onCategoryChange={handleCategoryChange}
            disableFilters={disableFilters}
        >
            <div className={styles['cards-wrap']}>
                {renderCertificationsList()}
            </div>
        </TabContentLayout>
    )
}

export default CompletedTab
