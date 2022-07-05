import imgBugHunt from '../../../work-images/bug-hunt-main.jpeg'
import { WorkType } from '../work-factory'

import { WorkIntakeFormRoutes } from './work-intake-form-routes.config'
import { bugHunt as workPriceBugHunt } from './work-prices.config'
import { WorkTimelines } from './work-timelines.config'
import { WorkTypeConfig } from './work-type.model'

export const WorkTypeConfigs: { [workType: string]: WorkTypeConfig } = {
    // TODO: determine duration, intakeFormRoutes, timeline, challenge ids, etc
    [WorkType.bugHunt]: {
        about: `Our Website Bug Hunt services remove the burden of testing from you and your teams
                and provide detailed results quickly. This rapid testing cycle will empower you with
                information fast, so that your web developers can quickly address those problems.
                The Bug Hunt will start with a registration period, where experienced quality assurance
                engineers signup to register for the bug hunt. After the registration period completes,
                we will run the bug hunt for the time which meets the option you choose below.`,
        bgImage: imgBugHunt,
        description: 'This is Bug Hunt description',
        duration: 8,
        featured: true,
        intakeFormRoutes: WorkIntakeFormRoutes[WorkType.bugHunt],
        results: `You will receive thorough testing of your website, and at the conclusion will be provided
                a detailed report of bugs which have steps to reproduce, screenshots / videos if applicable,
                details of the bug, and severity of the issue.`,
        shortDescription: 'Find bugs quickly and vigorously',
        startRoute: WorkIntakeFormRoutes[WorkType.bugHunt][1],
        subtitle: `Conduct a time based testing bug hunt where Topcoder experts scramble to find bugs or issues on your website`,
        timeline: WorkTimelines[WorkType.bugHunt],
        timelineTemplateId: '7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c',
        title: WorkType.bugHunt,
        trackId: 'c0f5d461-8219-4c14-878a-c3a3f356466d',
        type: WorkType.bugHunt,
        typeId: '927abff4-7af9-4145-8ba1-577c16e64e2e',
        ...workPriceBugHunt,
        // TODO: do we need to include breadcrumbs here?
    },
}

export const bugHuntConfig: WorkTypeConfig = WorkTypeConfigs[WorkType.bugHunt]
