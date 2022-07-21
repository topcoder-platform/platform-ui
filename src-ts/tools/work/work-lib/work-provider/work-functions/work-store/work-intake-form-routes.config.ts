import { WorkType } from './work-type.enum'

export const WorkIntakeFormRoutes: Record<string, any> = { // { [workType: string]: object } = {
    [WorkType.bugHunt]: {
        basicInfo: '/self-service/work/new/bug-hunt/basic-info',
        loginPrompt: '/self-service/work/new/bug-hunt/login-prompt',
        review: '/self-service/work/new/bug-hunt/review',
        thankYou: '/self-service/work/new/bug-hunt/thank-you',
    },
}
