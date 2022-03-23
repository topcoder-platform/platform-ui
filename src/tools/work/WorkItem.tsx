import { Dispatch, FC, FormEvent, SetStateAction, useContext, useState } from 'react'
import styles from './Work.module.scss'
import PT from "prop-types";

export interface WorkItemProps {
    challengeStatus: string,
    created: string,
    id: string,
    messagesCount: number,
    messagesHasNew: boolean,
    name: string,
    numOfRegistrants: number,
    rating: number,
    status: string,
    workStatus: string,
}

const WorkItem: FC<WorkItemProps> = (props: WorkItemProps) => {
    return (
        <>
            <div className="work-item-outer-content">
                <div className="work-item-inner-content">
                    <div className="work-item-status-bar">
                        <div className="work-item-status-draft">
                            <div className="work-item-status-text-draft">{props.challengeStatus}</div>
                        </div>
                        <div className="work-item-created-date-frame">
                            <div className="work-item-created-date-text">{props.created}</div>
                        </div>
                        <div className="work-item-menu-more">
                            ...
                        </div>
                    </div>
                    <div className="work-item-detail">
                        <div className="work-item-detail-title">{props.name}</div>
                        <div className="work-item-detail">
                            <div className="work-item-detail">Web Design</div>
                        </div>
                    </div>
                    <div className="work-item-metadata-frame">
                        <div className="work-item-metadata-work-id">WORK ID: #{props.id}</div>
                        <div className="work-item-metadata-participants">PARTICIPANTS: {props.numOfRegistrants}</div>
                        {props.messagesCount > 0 &&
                            <div className="work-item-metadata-unread-frame">
                                <div className="work-item-metadata-unread-text">UNREAD MESSAGES</div>
                                <div className="work-item-metadata-unread-icon-frame">
                                    <div className="work-item-metadata-unread-icon-ellipse"/>
                                    <div className="work-item-metadata-unread-icon-text">{props.messagesCount}</div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

WorkItem.propTypes = {
    challengeStatus: PT.string.isRequired,
    created: PT.string.isRequired,
    id: PT.string.isRequired,
    messagesCount: PT.number.isRequired,
    messagesHasNew: PT.bool.isRequired,
    name: PT.string.isRequired,
    numOfRegistrants: PT.number.isRequired,
    rating: PT.number.isRequired,
    status: PT.string.isRequired,
    workStatus: PT.string.isRequired,
};

export default WorkItem

