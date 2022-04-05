import { FC } from 'react'
import { ContentLayout } from '../../lib'
import styles from './SelfService.module.scss'
import { WorkItem } from '../../lib/work-provider'

export const toolTitle: string = 'Self Service'

const SelfService: FC<{}> = () => {

    const workItem: WorkItem = {
        challengeStatus: "DRAFT",
        created: "April 8, 2022",
        id: "1234567890",
        initialized: true,
        messagesCount: 9,
        messagesHasNew: true,
        name: "Dog Walking Service Website Development",
        numOfRegistrants: 50,
        rating: 1,
        status: "DRAFT",
        workStatus: "n/a",
    }

    const showDraft = false;
    const showActive = true;
    const showReady = false;
    const showDone = false;
    const showCancelled = false;
    const showRedirected = false;
    const showAll = false;

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
            <div className="self-service-header-frame">
                <table className="self-service-header-table">
                    <colgroup>
                        <col className="self-service-icon" />
                        <col className="self-service-title" />
                        <col className="self-service-status" />
                        <col className="self-service-type" />
                        <col className="self-service-created" />
                        <col className="self-service-solutions" />
                        <col className="self-service-cost" />
                        <col className="self-service-messages" />
                        <col className="self-service-delete" />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td>
                                <div className="self-service-header-cell-draft">
                                    <div className="self-service-header-cell-draft-text">
                                        <p onClick={() => draftClicked()}>DRAFT</p>
                                    </div>
                                    {showDraft &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-draft-count-bg">
                                        <div className="self-service-header-cell-draft-count-text">
                                            {draftCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-active">
                                    <div className="self-service-header-cell-active-text">
                                        <p onClick={() => activeClicked()}>ACTIVE</p>
                                    </div>
                                    {showActive &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-active-count-bg">
                                        <div className="self-service-header-cell-active-count-text">
                                            {activeCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-ready">
                                    <div className="self-service-header-cell-ready-text">
                                        <p onClick={() => readyClicked()}>SOLUTIONS READY</p>
                                    </div>
                                    {showReady &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-ready-count-bg">
                                        <div className="self-service-header-cell-ready-count-text">
                                            {readyCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-redir">
                                    <div className="self-service-header-cell-redir-text">
                                        <p onClick={() => redirectedClicked()}>REDIRECTED</p>
                                    </div>
                                    {showRedirected &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-redir-count-bg">
                                        <div className="self-service-header-cell-redir-count-text">
                                            {redirectedCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-done">
                                    <div className="self-service-header-cell-done-text">
                                        <p onClick={() => doneClicked()}>DONE</p>
                                    </div>
                                    {showDone &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-done-count-bg">
                                        <div className="self-service-header-cell-done-count-text">
                                            {doneCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-cancelled">
                                    <div className="self-service-header-cell-cancelled-text">
                                        <p onClick={() => cancelledClicked()}>CANCELLED</p>
                                    </div>
                                    {showCancelled &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-cancelled-count-bg">
                                        <div className="self-service-header-cell-cancelled-count-text">
                                            {cancelledCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="self-service-header-cell-all">
                                    <div className="self-service-header-cell-all-text">
                                        <p onClick={() => allClicked()}>ALL</p>
                                    </div>
                                    {showAll &&
                                        <div className="self-service-header-visible-category"/>
                                    }
                                    <div className="self-service-header-cell-all-count-bg">
                                        <div className="self-service-header-cell-all-count-text">
                                            {allCount}
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table className="self-service-item-table">
                <colgroup>
                    <col className="self-service-icon" />
                    <col className="self-service-title" />
                    <col className="self-service-status" />
                    <col className="self-service-type" />
                    <col className="self-service-created" />
                    <col className="self-service-solutions" />
                    <col className="self-service-cost" />
                    <col className="self-service-messages" />
                    <col className="self-service-delete" />
                </colgroup>
                <tbody>
                    <tr>
                        <td>
                        </td>
                        <td>
                            <div className="self-service-cell-title-inner">
                                <div className="self-service-title">{workItem.name}</div>
                                <br/>
                                <div className="self-service-description">
                                    A dog walking website that allows visitors to select dog walkers and
                                    schedule dog walking appointments
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className="self-service-status-chip">
                                <div className="self-service-status-text">
                                    {workItem.status}
                                </div>
                            </div>
                        </td>
                        <td>
                            <div className="self-service-type-text">
                                {workItem.workStatus}
                            </div>
                        </td>
                        <td>
                            <div className="self-service-created-text">{workItem.created}</div>
                        </td>
                        <td>
                            <div className="self-service-solutions-text">April 28, 2022</div>
                        </td>
                        <td>
                            <div className="self-service-cost-text">$12,000</div>
                        </td>
                        <td>
                            {workItem.messagesHasNew &&
                                <div className="self-service-messages-chip-red">
                                    <div className="self-service-messages-text">
                                        {workItem.messagesCount}
                                    </div>
                                </div>
                            }
                            {!workItem.messagesHasNew &&
                                <div className="self-service-messages-chip-gray">
                                    <div className="self-service-messages-text">
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
