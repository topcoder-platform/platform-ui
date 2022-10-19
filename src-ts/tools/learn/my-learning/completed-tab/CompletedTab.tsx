import { FC, ReactNode } from 'react'

import { LearnCertification, MyCourseCompletedCard, UserCertificationCompleted } from '../../learn-lib'
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

    const renderCertificationsList: () => ReactNode = () => (
        certifications.map((certif) => (
            <MyCourseCompletedCard
                certification={props.certificatesById[certif.certificationId]}
                key={certif.certificationId}
                completed={certif.completedDate}
            />
        ))
    )

    return (
        <TabContentLayout
            certifications={props.allCertificates}
            title={MyTabsViews.completed}
            sortOptions={sortOptions.completed}
            onSortChange={handleSortChange}
            onCategoryChange={handleCategoryChange}
        >
            <div className={styles['cards-wrap']}>
                {renderCertificationsList()}
            </div>
        </TabContentLayout>
    )
}

export default CompletedTab
