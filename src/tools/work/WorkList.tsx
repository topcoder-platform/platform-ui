import { useContext } from 'react'
import WorkItem from './WorkItem'
import { MyWorkContext, MyWorkContextData } from '../../lib/mywork-provider'

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
