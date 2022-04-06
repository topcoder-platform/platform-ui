import { FC } from 'react'
import { ContentLayout } from '../../lib'
import styles from './SelfService.module.scss'
import { WorkItem } from '../../lib/work-provider'
import { DataScienceIcon, DesignIcon, DevelopmentIcon } from '../../lib'

export const toolTitle: string = 'Self Service'

const SelfService: FC<{}> = () => {

    let workStatuses: Array<string> = ['DRAFT', 'ACTIVE', 'SUBMITTED', 'IN REVIEW', 'REDIRECTED', 'CANCELLED', 'COMPLETE', 'ALL'];
    let workTypes: Array<string> = ['Website Design', 'Website Development', 'Data Exploration'];

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
    }

    let showingStatus = 1;
    let workItemStatus = workItem.numOfRegistrants;
    let workItemType = workItem.rating;

    const activeCount = 1;
    const draftCount = 2;
    const readyCount = 1;
    const doneCount = 4;
    const redirectedCount = 1;
    const cancelledCount = 2;
    const allCount = 11;

    const activeClicked = () => {
        alert("show active");
        workItem.name="blah";
        //this.forceUpdate();
    }

    const draftClicked = () => { alert("show draft"); }
    const redirectedClicked = () => { alert("show redirected"); }
    const doneClicked = () => { alert("show done"); }
    const readyClicked = () => { alert("show ready");}
    const cancelledClicked = () => { alert("show cancelled");}
    const allClicked = () => { alert("show all");}

    return (
        <ContentLayout classNames={styles['self-service']} title={toolTitle}>
            <div className={styles["self-service-header-frame"]}>
                <table className={styles["self-service-header-table"]}>
                    <colgroup>
                        <col className={styles["self-service-icon"]} />
                        <col className={styles["self-service-title"]} />
                        <col className={styles["self-service-status"]} />
                        <col className={styles["self-service-type"]} />
                        <col className={styles["self-service-created"]} />
                        <col className={styles["self-service-solutions"]} />
                        <col className={styles["self-service-cost"]} />
                        <col className={styles["self-service-messages"]} />
                        <col className={styles["self-service-delete"]} />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-draft-text"]}>
                                        <p onClick={() => draftClicked()}>{workStatuses[0]}</p>
                                    </div>
                                    {showingStatus === 0 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-draft-count-bg"]}>
                                        <div className={styles["self-service-header-cell-draft-count-text"]}>
                                            {draftCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-active-text"]}>
                                        <p onClick={() => activeClicked()}>{workStatuses[1]}</p>
                                    </div>
                                    {showingStatus == 1 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-active-count-bg"]}>
                                        <div className={styles["self-service-header-cell-active-count-text"]}>
                                            {activeCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-submitted-text"]}>
                                        <p onClick={() => readyClicked()}>{workStatuses[2]}</p>
                                    </div>
                                    {showingStatus === 2 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-submitted-count-bg"]}>
                                        <div className={styles["self-service-header-cell-submitted-count-text"]}>
                                            {readyCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-in-review-text"]}>
                                        <p onClick={() => redirectedClicked()}>{workStatuses[3]}</p>
                                    </div>
                                    {showingStatus === 3 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-in-review-count-bg"]}>
                                        <div className={styles["self-service-header-cell-in-review-count-text"]}>
                                            {redirectedCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-redirected-text"]}>
                                        <p onClick={() => doneClicked()}>{workStatuses[4]}</p>
                                    </div>
                                    {showingStatus === 4 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-redirected-count-bg"]}>
                                        <div className={styles["self-service-header-cell-redirected-count-text"]}>
                                            {doneCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-cancelled-text"]}>
                                        <p onClick={() => cancelledClicked()}>{workStatuses[5]}</p>
                                    </div>
                                    {showingStatus === 5 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-cancelled-count-bg"]}>
                                        <div className={styles["self-service-header-cell-cancelled-count-text"]}>
                                            {cancelledCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-complete-text"]}>
                                        <p onClick={() => allClicked()}>{workStatuses[6]}</p>
                                    </div>
                                    {showingStatus === 6 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-complete-count-bg"]}>
                                        <div className={styles["self-service-header-cell-complete-count-text"]}>
                                            {allCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className={styles["self-service-header-cell"]}>
                                    <div className={styles["self-service-header-cell-all-text"]}>
                                        <p onClick={() => allClicked()}>{workStatuses[7]}</p>
                                    </div>
                                    {showingStatus === 7 &&
                                        <div className={styles["self-service-header-visible-category"]} />
                                    }
                                    <div className={styles["self-service-header-cell-all-count-bg"]}>
                                        <div className={styles["self-service-header-cell-all-count-text"]}>
                                            {allCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table className={styles["self-service-item-table"]}>
                <colgroup>
                    <col className={styles["self-service-icon"]} />
                    <col className={styles["self-service-title"]} />
                    <col className={styles["self-service-status"]} />
                    <col className={styles["self-service-type"]} />
                    <col className={styles["self-service-created"]} />
                    <col className={styles["self-service-solutions"]} />
                    <col className={styles["self-service-cost"]} />
                    <col className={styles["self-service-messages"]} />
                    <col className={styles["self-service-delete"]} />
                </colgroup>
                <tbody>
                    <tr>
                        <td>
                            {workItemType === 0 && <DesignIcon/>}
                            {workItemType === 1 && <DevelopmentIcon/>}
                            {workItemType === 2 && <DataScienceIcon/>}
                        </td>
                        <td>
                            <div className={styles["self-service-cell-title-inner"]}>
                                <div className={styles["self-service-title"]}>{workItem.name}</div>
                                <br/>
                                <div className={styles["self-service-description"]}>
                                    A dog walking website that allows visitors to select dog walkers and
                                    schedule dog walking appointments
                                </div>
                            </div>
                        </td>
                        <td>
                            {workItemStatus === 0 &&
                                <div className={styles["self-service-status-circle-draft"]}/>
                            }
                            {workItemStatus === 1 &&
                                <div className={styles["self-service-status-circle-active"]}/>
                            }
                            {workItemStatus === 2 &&
                                <div className={styles["self-service-status-circle-submitted"]}/>
                            }
                            {workItemStatus === 3 &&
                                <div className={styles["self-service-status-circle-in-review"]}/>
                            }
                            {workItemStatus === 4 &&
                                <div className={styles["self-service-status-circle-redirected"]}/>
                            }
                            {workItemStatus === 5 &&
                                <div className={styles["self-service-status-circle-cancelled"]}/>
                            }
                            {workItemStatus === 6 &&
                                <div className={styles["self-service-status-circle-complete"]}/>
                            }
                            <div className={styles["self-service-status-text"]}>
                                {workStatuses[workItemStatus]}
                            </div>
                        </td>
                        <td>
                            <div className={styles["self-service-type-text"]}>
                                {workTypes[workItemType]}
                            </div>
                        </td>
                        <td>
                            <div className={styles["self-service-created-text"]}>{workItem.created}</div>
                        </td>
                        <td>
                            <div className={styles["self-service-solutions-text"]}>April 28, 2022</div>
                        </td>
                        <td>
                            <div className={styles["self-service-cost-text"]}>$12,000</div>
                        </td>
                        <td>
                            {workItem.messagesHasNew &&
                                <div className={styles["self-service-messages-chip-red"]}>
                                    <div className={styles["self-service-messages-text"]}>
                                        {workItem.messagesCount}
                                    </div>
                                </div>
                            }
                            {!workItem.messagesHasNew &&
                                <div className={styles["self-service-messages-chip-gray"]}>
                                    <div className={styles["self-service-messages-text"]}>
                                        {workItem.messagesCount}
                                    </div>
                                </div>
                            }
                        </td>
                        <td>
                            <img/>
                        </td>
                    </tr>
                </tbody>
            </table>
        </ContentLayout>
    )
}

export default SelfService
