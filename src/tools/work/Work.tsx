import { FC } from 'react'

import { ContentLayout } from '../../lib'
import { WorkItem } from '../../lib/work-provider'

// TODO: reduce number of classes, remove hwtls, mixins for colors, mixins for fonts, table cell widths.
import styles from './Work.module.scss'
import { getFilteredWork, getSortDefinitionForFilter, setAllWork, setSortColumnForFilter } from './WorkFilter'
import { WorkSortDefinition } from './WorkSorter'

export const toolTitle: string = 'Work'

const Work: FC<{}> = () => {

    // TODO: remove mock data
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

    // TODO: simplify these styles
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

    const workStatusCircleStyles: Array<string> = [
        'work-status-circle-draft',
        'work-status-circle-active',
        'work-status-circle-submitted',
        'work-status-circle-in-review',
        'work-status-circle-redirected',
        'work-status-circle-cancelled',
        'work-status-circle-complete',
    ]

    const workStatuses: Array<string> = ['DRAFT', 'ACTIVE', 'SUBMITTED', 'IN REVIEW', 'REDIRECTED', 'CANCELLED', 'COMPLETE', 'ALL']
    const workTypes: Array<string> = ['Website Design', 'Website Development', 'Data Exploration']
    let visibleFilter: number = 0
    let currWork: Array<WorkItem> = []
    // default sort is by title, ascending
    let currSort: WorkSortDefinition = { column: 0, order: 'asc' }

    function filterClicked(filter: number): void {
        visibleFilter = filter
        currWork = getFilteredWork(filter)
        currSort = getSortDefinitionForFilter(filter)
        // TODO: force refresh for dev testing
    }

    function sortClicked(column: number): void {
        const newSort: WorkSortDefinition = {
            column,
            order: 'asc',
        }
        if (column === currSort.column) {
            newSort.order = (currSort.order === 'asc') ? 'desc' : 'asc'
        }
        setSortColumnForFilter(visibleFilter, newSort)
        currWork = getFilteredWork(visibleFilter)
        currSort = getSortDefinitionForFilter(visibleFilter)
    }

    const allWorkMock: Array<WorkItem> = [workItem, workItem, workItem]
    allWorkMock[1].rating = 1

    // TODO: remove mock data (description, solution ready date)
    // TODO: reduce divs through loops and combining styles
    // TODO: Make filters not a table.
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
                                            {visibleFilter === filter &&
                                                <div className={styles['work-header-visible-category']} />
                                            }
                                            <div className={styles[filterCountBgStyles[filter]]}>
                                                <div className={styles[filterCountTextStyles[filter]]}>
                                                    {currWork.length}
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
                    {currWork.map(currentWorkItem => {
                        return (
                            <tr>
                                <td>
                                </td>
                                <td>
                                    <div className={styles['work-cell-title-inner']}>
                                        <div className={styles['work-title']}>{currentWorkItem.name}</div>
                                        <br />
                                        <div className={styles['work-description']}>
                                            A dog walking website that allows visitors to select dog walkers and
                                            schedule dog walking appointments
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles[workStatusCircleStyles[currentWorkItem.rating]]} />
                                    <div className={styles['work-status-text']}>
                                        {workStatuses[currentWorkItem.rating]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles['work-type-text']}>
                                        {workTypes[currentWorkItem.numOfRegistrants]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles['work-created-text']}>{currentWorkItem.created}</div>
                                </td>
                                <td>
                                    <div className={styles['work-solutions-text']}>April 28, 2022</div>
                                </td>
                                <td>
                                    <div className={styles['work-cost-text']}>$12,000</div>
                                </td>
                                <td>
                                    {currentWorkItem.messagesHasNew &&
                                        <div className={styles['work-messages-chip-red']}>
                                            <div className={styles['work-messages-text']}>
                                                {currentWorkItem.messagesCount}
                                            </div>
                                        </div>
                                    }
                                    {!currentWorkItem.messagesHasNew &&
                                        <div className={styles['work-messages-chip-gray']}>
                                            <div className={styles['work-messages-text']}>
                                                {currentWorkItem.messagesCount}
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
