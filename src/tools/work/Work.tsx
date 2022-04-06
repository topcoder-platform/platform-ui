import { FC } from 'react'

import { ContentLayout, DataScienceIcon, DesignIcon, DevelopmentIcon } from '../../lib'
import { WorkItem } from '../../lib/work-provider'

import styles from './Work.module.scss'

export const toolTitle: string = 'Work'

const Work: FC<{}> = () => {

    const workItem: WorkItem = {
        challengeStatus: 'DRAFT',
        created: 'April 8, 2022',
        id: '1234567890',
        initialized: true,
        messagesCount: 9,
        messagesHasNew: true,
        name: 'Dog Walking Service Website Development',
        numOfRegistrants: 1,
        rating: 0,
        status: 'DRAFT',
        workStatus: 'DRAFT',
    }

    const allWork: Array<WorkItem> = [workItem, workItem]

    const filterTextStyles: Array<string> = [
        'work-header-cell-draft-text',
        'work-header-cell-active-text',
        'work-header-cell-submitted-text',
        'work-header-cell-in-review-text',
        'work-header-cell-redirected-text',
        'work-header-cell-cancelled-text',
        'work-header-cell-complete-text',
        'work-header-cell-all-text',
    ]

    const filterCountBgStyles: Array<string> = [
        'work-header-cell-draft-count-bg',
        'work-header-cell-active-count-bg',
        'work-header-cell-submitted-count-bg',
        'work-header-cell-in-review-count-bg',
        'work-header-cell-redirected-count-bg',
        'work-header-cell-cancelled-count-bg',
        'work-header-cell-complete-count-bg',
        'work-header-cell-all-count-bg',
    ]

    const filterCountTextStyles: Array<string> = [
        'work-header-cell-draft-count-text',
        'work-header-cell-active-count-text',
        'work-header-cell-submitted-count-text',
        'work-header-cell-in-review-count-text',
        'work-header-cell-redirected-count-text',
        'work-header-cell-cancelled-count-text',
        'work-header-cell-complete-count-text',
        'work-header-cell-all-count-text',
    ]

    const workStatuses: Array<string> = ['DRAFT', 'ACTIVE', 'SUBMITTED', 'IN REVIEW', 'REDIRECTED', 'CANCELLED', 'COMPLETE', 'ALL']
    const workTypes: Array<string> = ['Website Design', 'Website Development', 'Data Exploration']
    const sortedColumns: Array<number> = [-1, -1, -1, -1, -1]
    const sortedDirection: Array<Array<number>> = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
    ]
    const categorizedWork: Array<Array<WorkItem>> = [[]]

    function createTabs() {
        allWork.forEach((work: WorkItem) => {
           categorizedWork[work.rating].push(work)
        })
    }

//    function sortColumnAscending(column: number, work: Array<WorkItem>) {
//        work.sort((a: WorkItem, b: WorkItem) => {
//            // based on column
//            if (sortedDirection)
//            if (column === 0) { return (a.challengeStatus.localeCompare(b.challengeStatus)); }
//            if (column === 1) { return (a.workStatus.localeCompare(b.workStatus)); }
//            if (column === 2) { return (a. created.localeCompare(b.created)); }
//            // where is solutions ready if (column === 3) { return (a.challengeStatus.localCompare(b.challengeStatus); }
//            // no cost yet if (column === 4) { return (a.challengeStatus.localCompare(b.challengeStatus); }
//        } )
//    }

    function isDraft(workItem: WorkItem) { return (workItem.rating === 0) }
    function isActive(workItem: WorkItem) { return (workItem.rating === 1) }
    function isSubmitted(workItem: WorkItem) { return (workItem.rating === 2) }
    function isInReview(workItem: WorkItem) { return (workItem.rating === 3) }
    function isRedirected(workItem: WorkItem) { return (workItem.rating === 4) }
    function isCancelled(workItem: WorkItem) { return (workItem.rating === 5) }
    function isComplete(workItem: WorkItem) { return (workItem.rating === 6) }

    let showingStatus = 0

    const filterClicked = (filter: number) => {
        alert(filter)
        showingStatus = filter
    }

    createTabs()
    showingStatus = 0

    return (
        <ContentLayout title={toolTitle}>
            <div className={styles['work-header-frame']}>
                <table className={styles['work-header-table']}>
                    <colgroup>
                        <col className={styles['work-icon']} />
                        <col className={styles['work-title']} />
                        <col className={styles['work-status']} />
                        <col className={styles['work-type']} />
                        <col className={styles['work-created']} />
                        <col className={styles['work-solutions']} />
                        <col className={styles['work-cost']} />
                        <col className={styles['work-messages']} />
                        <col className={styles['work-delete']} />
                    </colgroup>
                    <tbody>
                        <tr>
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(filter => {
                                return (
                                    <td>
                                        <div className={styles['work-header-cell']}>
                                            <div className={styles[filterTextStyles[filter]]}>
                                                <p onClick={() => filterClicked(filter)}>{workStatuses[filter]}</p>
                                            </div>
                                            {showingStatus === filter &&
                                                <div className={styles['work-header-visible-category']} />
                                            }
                                            <div className={styles[filterCountBgStyles[filter]]}>
                                                <div className={styles[filterCountTextStyles[filter]]}>
                                                    {categorizedWork[filter]?.length}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
            <table className={styles['work-item-table']}>
                <colgroup>
                    <col className={styles['work-icon']} />
                    <col className={styles['work-title']} />
                    <col className={styles['work-status']} />
                    <col className={styles['work-type']} />
                    <col className={styles['work-created']} />
                    <col className={styles['work-solutions']} />
                    <col className={styles['work-cost']} />
                    <col className={styles['work-messages']} />
                    <col className={styles['work-delete']} />
                </colgroup>
                <tbody>
                    <tr>
                        <td />
                        <td />
                        <td>
                            <div className={styles['work-sort-by-text']}>STATUS</div>
                        </td>
                        <td>
                            <div className={styles['work-sort-by-text']}>TYPE</div>
                        </td>
                        <td>
                            <div className={styles['work-sort-by-text']}>CREATED</div>
                        </td>
                        <td>
                            <div className={styles['work-sort-by-text']}>SOLUTIONS READY</div>
                        </td>
                        <td>
                            <div className={styles['work-sort-by-text']}>COST</div>
                        </td>
                        <td>
                            <div className={styles['work-sort-by-text']}>MESSAGES</div>
                        </td>
                        <td />
                    </tr>
                    {categorizedWork[showingStatus].map(workItem => {
                        return (
                            <tr>
                                <td>
                                    {workItem.numOfRegistrants === 0 && <DesignIcon />}
                                    {workItem.numOfRegistrants === 1 && <DevelopmentIcon />}
                                    {workItem.numOfRegistrants === 2 && <DataScienceIcon />}
                                </td>
                                <td>
                                    <div className={styles['work-cell-title-inner']}>
                                        <div className={styles['work-title']}>{workItem.name}</div>
                                        <br />
                                        <div className={styles['work-description']}>
                                            A dog walking website that allows visitors to select dog walkers and
                                            schedule dog walking appointments
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {workItem.rating === 0 &&
                                        <div className={styles['work-status-circle-draft']} />
                                    }
                                    {workItem.rating === 1 &&
                                        <div className={styles['work-status-circle-active']} />
                                    }
                                    {workItem.rating === 2 &&
                                        <div className={styles['work-status-circle-submitted']} />
                                    }
                                    {workItem.rating === 3 &&
                                        <div className={styles['work-status-circle-in-review']} />
                                    }
                                    {workItem.rating === 4 &&
                                        <div className={styles['work-status-circle-redirected']} />
                                    }
                                    {workItem.rating === 5 &&
                                        <div className={styles['work-status-circle-cancelled']} />
                                    }
                                    {workItem.rating === 6 &&
                                        <div className={styles['work-status-circle-complete']} />
                                    }
                                    <div className={styles['work-status-text']}>
                                        {workStatuses[workItem.rating]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles['work-type-text']}>
                                        {workTypes[workItem.numOfRegistrants]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles['work-created-text']}>{workItem.created}</div>
                                </td>
                                <td>
                                    <div className={styles['work-solutions-text']}>April 28, 2022</div>
                                </td>
                                <td>
                                    <div className={styles['work-cost-text']}>$12,000</div>
                                </td>
                                <td>
                                    {workItem.messagesHasNew &&
                                        <div className={styles['work-messages-chip-red']}>
                                            <div className={styles['work-messages-text']}>
                                                {workItem.messagesCount}
                                            </div>
                                        </div>
                                    }
                                    {!workItem.messagesHasNew &&
                                        <div className={styles['work-messages-chip-gray']}>
                                            <div className={styles['work-messages-text']}>
                                                {workItem.messagesCount}
                                            </div>
                                        </div>
                                    }
                                </td>
                                <td>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </ContentLayout>
    )
}

export default Work
