import { bugHuntTileImg } from '../../../work-images'

import { ChallengeTag } from './challenge-tag.enum'
import { WorkIntakeFormRoutes } from './work-intake-form-routes.config'
import { bugHunt as workPriceBugHunt } from './work-prices.store'
import { WorkTimelines } from './work-timelines.config'
import { WorkType } from './work-type.enum'
import { WorkTypeConfig } from './work-type.model'

export const WorkTypeConfigs: { [workType: string]: WorkTypeConfig } = {
    // TODO: Verify timelineTemplateId, trackId, typeId
    [WorkType.bugHunt]: {
        about: `Our Website Bug Hunt services remove the burden of testing from you and your teams and provide detailed results quickly.
                Topcoder has conducted hundreds bug hunts for customers like you. For each bug hunt, we average between 25 and 150 bug hunters,
                and we typically find a significant number bugs which helps improve quality of your site. The Bug Hunt will start with a
                registration period, where experienced quality assurance engineers signup to register for the bug hunt. After the registration
                period completes, we will run the bug hunt for the time which meets the option you choose below.`,
        bgImage: bugHuntTileImg,
        deliverablesDescription: `You will receive thorough testing of your website, and at the conclusion will be provided
        a detailed report of bugs which have steps to reproduce, screenshots / videos if applicable,
        details of the bug, and severity of the issue.`,
        description: 'Conduct a time based testing bug hunt where Topcoder experts scramble to find bugs or issues in the system',
        duration: {
            'advanced': 6,
            'premium': 7,
            'standard': 5,
        },
        featured: false,
        intakeFormRoutes: WorkIntakeFormRoutes[WorkType.bugHunt],
        priceConfig: workPriceBugHunt,
        results: `You will receive thorough testing of your website, and at the conclusion will be provided
                a detailed report of bugs which have steps to reproduce, screenshots / videos if applicable,
                details of the bug, and severity of the issue.`,
        review: {
            aboutYourProjectTitle: 'Important things to know about your project',
            subtitle: 'Website Bug Hunt',
            title: 'Review & Payment',
            type: 'Review & Payment',
        },
        shortDescription: 'Find bugs quickly and vigorously',
        startRoute: WorkIntakeFormRoutes[WorkType.bugHunt]['basicInfo'],
        submissionPhaseDuration: {
            'advanced': 172800, // 2 days
            'premium': 259200, // 3 days
            'standard': 86400, // 1 day
        },
        subtitle: `Conduct a time based testing bug hunt where Topcoder experts scramble to find bugs or issues in the system`,
        tags: [ChallengeTag.qa],
        timeline: WorkTimelines[WorkType.bugHunt],
        timelineTemplateId: '7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c', // Default Challenge
        title: WorkType.bugHunt,
        trackId: '36e6a8d0-7e1e-4608-a673-64279d99c115', // QA
        type: WorkType.bugHunt,
        typeId: '927abff4-7af9-4145-8ba1-577c16e64e2e', // Challenge
    },
}

export const bugHuntConfig: WorkTypeConfig = WorkTypeConfigs[WorkType.bugHunt]
