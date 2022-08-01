import { WorkType } from './work-type.enum'

export const WorkIntakeFormRoutes: Record<string, any> = {
    [WorkType.bugHunt]: {
        basicInfo: '/self-service/work/new/bug-hunt/basic-info',
        loginPrompt: '/self-service/work/new/bug-hunt/login-prompt',
        review: '/self-service/work/new/bug-hunt/review',
        saveAfterLogin: '/self-service/work/new/bug-hunt/save-after-login',
        thankYou: '/self-service/work/new/bug-hunt/thank-you',
    },
}
