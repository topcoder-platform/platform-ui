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
        about: 'Expert QA testers will verify that all of the pages on your website are working correctly from the end-user perspective. The testing will stress functional issues, but also includes security issues, user interface issues, usability issues and more. Test on desktop, tablet, and mobile,  to uncover bugs before your customers encounter them.',
        bgImage: bugHuntTileImg,
        deliverablesDescription: 'You will receive thorough testing of your website by QA experts, and an actionable report extremely quickly. Our experts will deliver a detailed list of bugs found, with steps to reproduce, including screenshots, videos, and the information you need to fix them.',
        description: 'Execute thorough bug hunts exceptionally fast. Receive a detailed list of bugs and instructions on exactly how to fix them.',
        duration: {
            advanced: 6,
            premium: 7,
            standard: 5,
        },
        featured: false,
        intakeFormRoutes: WorkIntakeFormRoutes[WorkType.bugHunt],
        priceConfig: workPriceBugHunt,
        results: 'You will receive thorough testing of your website by QA experts, and an actionable report extremely quickly. Our experts will deliver a detailed list of bugs found, with steps to reproduce, including screenshots, videos, and the information you need to fix them.',
        review: {
            aboutYourProjectTitle: 'Important things to know about your project',
            subtitle: 'Website Bug Hunt',
            title: 'Review & Payment',
            type: 'Review & Payment',
        },
        shortDescription: 'Find bugs quickly and vigorously',
        startRoute: WorkIntakeFormRoutes[WorkType.bugHunt].basicInfo,
        submissionPhaseDuration: {
            advanced: 172800, // 2 days
            premium: 259200, // 3 days
            standard: 86400, // 1 day
        },
        subtitle: 'Execute thorough bug hunts exceptionally fast. Receive a detailed list of bugs and instructions on exactly how to fix them.',
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
