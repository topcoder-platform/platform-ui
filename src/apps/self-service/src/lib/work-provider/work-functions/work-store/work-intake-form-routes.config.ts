import { WorkType } from './work-type.enum'

export const WorkIntakeFormRoutes: Record<string, any> = {
    [WorkType.bugHunt]: {
        basicInfo: '/self-service/new/bug-hunt/basic-info',
        loginPrompt: '/self-service/new/bug-hunt/login-prompt',
        review: '/self-service/new/bug-hunt/review',
        saveAfterLogin: '/self-service/new/bug-hunt/save-after-login',
        thankYou: '/self-service/new/bug-hunt/thank-you',
    },
}
