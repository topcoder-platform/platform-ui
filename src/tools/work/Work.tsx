import { FC } from 'react'
import { ContentLayout } from '../../lib'
import styles from './Work.module.scss'
import { WorkItem } from '../../lib/work-provider'
import { DataScienceIcon, DesignIcon, DevelopmentIcon } from '../../lib'

export const toolTitle: string = 'Work'

const SelfService: FC<{}> = () => {

    const workStatuses: Array<string> = ['DRAFT', 'ACTIVE', 'SUBMITTED', 'IN REVIEW', 'REDIRECTED', 'CANCELLED', 'COMPLETE', 'ALL'];
    const workTypes: Array<string> = ['Website Design', 'Website Development', 'Data Exploration'];

    const workItem: WorkItem = {
        challengeStatus: "DRAFT",
        created: "April 8, 2022",
        id: "1234567890",
        initialized: true,
        messagesCount: 9,
        messagesHasNew: true,
        name: "Dog Walking Service Website Development",
        numOfRegistrants: 1,
        rating: 0,
        status: "DRAFT",
        workStatus: "DRAFT",
    };

    var allWork: Array<WorkItem> = [workItem, workItem];

    function isDraft(workItem: WorkItem) { return (workItem.rating === 0); }
    function isActive(workItem: WorkItem) { return (workItem.rating === 1); }
    function isSubmitted(workItem: WorkItem) { return (workItem.rating === 2); }
    function isInReview(workItem: WorkItem) { return (workItem.rating === 3); }
    function isRedirected(workItem: WorkItem) { return (workItem.rating === 4); }
    function isCancelled(workItem: WorkItem) { return (workItem.rating === 5); }
    function isComplete(workItem: WorkItem) { return (workItem.rating === 6); }

    var draftWork = allWork.filter(isDraft);
    var activeWork = allWork.filter(isActive);
    var submittedWork = allWork.filter(isDraft);
    var inReviewWork = allWork.filter(isDraft);
    var redirectedWork = allWork.filter(isDraft);
    var cancelledWork = allWork.filter(isDraft);
    var completeWork = allWork.filter(isDraft);
    var indexedWork: Array<Array<WorkItem>> = [draftWork, activeWork, submittedWork, inReviewWork, redirectedWork, cancelledWork, completeWork];
    let showingStatus = 0;
    let workItemStatus = workItem.numOfRegistrants;
    let workItemType = workItem.rating;

    const activeCount = 1;
    const draftCount = 2;
    const readyCount = 1;
    const doneCount = 4;
    const redirectedCount = 1;
    const cancelledCount = 2;
    const allCount = 11;

    const activeClicked = () => { alert("show active"); showingStatus = 1;
        //this.forceUpdate();
    }
    const draftClicked = () => { alert(indexedWork[0].length); showingStatus = 0; }
    const redirectedClicked = () => { alert("show redir"); showingStatus = 4; }
    const doneClicked = () => { alert("show complete"); showingStatus = 6; }
    const readyClicked = () => { alert("show ready");}
    const cancelledClicked = () => { alert("show cancelled");}
    const allClicked = () => { alert("show all");}

    return (
        <ContentLayout title={toolTitle}>
            <div className={styles["work-header-frame"]}>
                <table className={styles["work-header-table"]}>
                    <colgroup>
                        <col className={styles["work-icon"]} />
                        <col className={styles["work-title"]} />
                        <col className={styles["work-status"]} />
                        <col className={styles["work-type"]} />
                        <col className={styles["work-created"]} />
                        <col className={styles["work-solutions"]} />
                        <col className={styles["work-cost"]} />
                        <col className={styles["work-messages"]} />
                        <col className={styles["work-delete"]} />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-draft-text"]}>
                                        <p onClick={() => draftClicked()}>{workStatuses[0]}</p>
                                    </div>
                                    {showingStatus === 0 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-draft-count-bg"]}>
                                        <div className={styles["work-header-cell-draft-count-text"]}>
                                            {draftCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-active-text"]}>
                                        <p onClick={() => activeClicked()}>{workStatuses[1]}</p>
                                    </div>
                                    {showingStatus === 1 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-active-count-bg"]}>
                                        <div className={styles["work-header-cell-active-count-text"]}>
                                            {activeCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-submitted-text"]}>
                                        <p onClick={() => readyClicked()}>{workStatuses[2]}</p>
                                    </div>
                                    {showingStatus === 2 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-submitted-count-bg"]}>
                                        <div className={styles["work-header-cell-submitted-count-text"]}>
                                            {readyCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-in-review-text"]}>
                                        <p onClick={() => redirectedClicked()}>{workStatuses[3]}</p>
                                    </div>
                                    {showingStatus === 3 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-in-review-count-bg"]}>
                                        <div className={styles["work-header-cell-in-review-count-text"]}>
                                            {redirectedCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-redirected-text"]}>
                                        <p onClick={() => doneClicked()}>{workStatuses[4]}</p>
                                    </div>
                                    {showingStatus === 4 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-redirected-count-bg"]}>
                                        <div className={styles["work-header-cell-redirected-count-text"]}>
                                            {doneCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-cancelled-text"]}>
                                        <p onClick={() => cancelledClicked()}>{workStatuses[5]}</p>
                                    </div>
                                    {showingStatus === 5 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-cancelled-count-bg"]}>
                                        <div className={styles["work-header-cell-cancelled-count-text"]}>
                                            {cancelledCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-complete-text"]}>
                                        <p onClick={() => allClicked()}>{workStatuses[6]}</p>
                                    </div>
                                    {showingStatus === 6 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-complete-count-bg"]}>
                                        <div className={styles["work-header-cell-complete-count-text"]}>
                                            {allCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["work-header-cell"]}>
                                    <div className={styles["work-header-cell-all-text"]}>
                                        <p onClick={() => allClicked()}>{workStatuses[7]}</p>
                                    </div>
                                    {showingStatus === 7 &&
                                        <div className={styles["work-header-visible-category"]} />
                                    }
                                    <div className={styles["work-header-cell-all-count-bg"]}>
                                        <div className={styles["work-header-cell-all-count-text"]}>
                                            {allCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table className={styles["work-item-table"]}>
                <colgroup>
                    <col className={styles["work-icon"]} />
                    <col className={styles["work-title"]} />
                    <col className={styles["work-status"]} />
                    <col className={styles["work-type"]} />
                    <col className={styles["work-created"]} />
                    <col className={styles["work-solutions"]} />
                    <col className={styles["work-cost"]} />
                    <col className={styles["work-messages"]} />
                    <col className={styles["work-delete"]} />
                </colgroup>
                <tbody>
                    <tr>
                        <td/>
                        <td/>
                        <td>
                            <div className={styles["work-sort-by-text"]}>STATUS</div>
                        </td>
                        <td>
                            <div className={styles["work-sort-by-text"]}>TYPE</div>
                        </td>
                        <td>
                            <div className={styles["work-sort-by-text"]}>CREATED</div>
                        </td>
                        <td>
                            <div className={styles["work-sort-by-text"]}>SOLUTIONS READY</div>
                        </td>
                        <td>
                            <div className={styles["work-sort-by-text"]}>COST</div>
                        </td>
                        <td>
                            <div className={styles["work-sort-by-text"]}>MESSAGES</div>
                        </td>
                        <td/>
                    </tr>
                    {indexedWork[showingStatus].forEach(workItem => {
                        return (
                            <tr>
                                <td>
                                    {workItem.numOfRegistrants === 0 && <DesignIcon/>}
                                    {workItem.numOfRegistrants === 1 && <DevelopmentIcon/>}
                                    {workItem.numOfRegistrants === 2 && <DataScienceIcon/>}
                                </td>
                                <td>
                                    <div className={styles["work-cell-title-inner"]}>
                                        <div className={styles["work-title"]}>{workItem.name}</div>
                                        <br/>
                                        <div className={styles["work-description"]}>
                                            A dog walking website that allows visitors to select dog walkers and
                                            schedule dog walking appointments
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {workItem.rating === 0 &&
                                        <div className={styles["work-status-circle-draft"]}/>
                                    }
                                    {workItem.rating === 1 &&
                                        <div className={styles["work-status-circle-active"]}/>
                                    }
                                    {workItem.rating === 2 &&
                                        <div className={styles["work-status-circle-submitted"]}/>
                                    }
                                    {workItem.rating === 3 &&
                                        <div className={styles["work-status-circle-in-review"]}/>
                                    }
                                    {workItem.rating === 4 &&
                                        <div className={styles["work-status-circle-redirected"]}/>
                                    }
                                    {workItem.rating === 5 &&
                                        <div className={styles["work-status-circle-cancelled"]}/>
                                    }
                                    {workItem.rating === 6 &&
                                        <div className={styles["work-status-circle-complete"]}/>
                                    }
                                    <div className={styles["work-status-text"]}>
                                        {workStatuses[workItem.rating]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles["work-type-text"]}>
                                        {workTypes[workItem.numOfRegistrants]}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles["work-created-text"]}>{workItem.created}</div>
                                </td>
                                <td>
                                    <div className={styles["work-solutions-text"]}>April 28, 2022</div>
                                </td>
                                <td>
                                    <div className={styles["work-cost-text"]}>$12,000</div>
                                </td>
                                <td>
                                    {workItem.messagesHasNew &&
                                        <div className={styles["work-messages-chip-red"]}>
                                            <div className={styles["work-messages-text"]}>
                                                {workItem.messagesCount}
                                            </div>
                                        </div>
                                    }
                                    {!workItem.messagesHasNew &&
                                        <div className={styles["work-messages-chip-gray"]}>
                                            <div className={styles["work-messages-text"]}>
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

export default SelfService
