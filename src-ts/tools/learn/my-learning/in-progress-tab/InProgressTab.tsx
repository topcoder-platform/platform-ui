import { FC, ReactNode } from 'react'

import { LearnCertification, MyCourseInProgressCard, UserCertificationInProgress } from '../../learn-lib'
import { sortOptions } from '../my-learning-sort-options'
import { MyTabsViews } from '../my-tabs-navbar'
import { TabContentLayout } from '../tab-content-layout'
import { useSortAndFilter, UseSortAndFilterValue } from '../use-sort-and-filter'

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
        props.certifications
    )

    const renderCertificationsList: () => ReactNode = () => (
        certifications.map((certif) => (
            <MyCourseInProgressCard
                certification={props.certificatesById[certif.certificationId]}
                key={certif.certificationId}
                theme='detailed'
                currentLesson={certif.currentLesson}
                completedPercentage={certif.courseProgressPercentage / 100}
                startDate={certif.startDate}
            />
        ))
    )

    return (
        <TabContentLayout
            certifications={props.allCertificates}
            title={MyTabsViews.inProgress}
            sortOptions={sortOptions.inProgress}
            onSortChange={handleSortChange}
            onCategoryChange={handleCategoryChange}
        >
            {renderCertificationsList()}
        </TabContentLayout>
    )
}

export default InProgressTab
