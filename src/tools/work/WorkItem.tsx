import { FC } from 'react'
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

