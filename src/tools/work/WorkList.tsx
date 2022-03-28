import { useEffect, useState, Dispatch, SetStateAction, useContext } from 'react'
import WorkItem from './WorkItem'
import { ContentLayout } from '../../lib'
import styles from './Work.module.scss'
import { MyWorkContext, MyWorkContextData, getMyWork } from '../../lib/mywork-provider'

const WorkList = () => {

    const workContext: MyWorkContextData = useContext(MyWorkContext)
    const { myWork }: MyWorkContextData = workContext

    return (
        <>
            {myWork?.workItems?.forEach ((value: MyWorkContextData,) => {
                return (<WorkItem
                    challengeStatus="active"
                    created="12/22/21"
                    id="123456789"
                    messagesCount={1}
                    messagesHasNew={true}
                    name="Amazing new website"
                    numOfRegistrants={14}
                    rating={1}
                    status="draft"
                    workStatus="In Progress"
                />)
                }
            )}

        </>
      );
}

export default WorkList
