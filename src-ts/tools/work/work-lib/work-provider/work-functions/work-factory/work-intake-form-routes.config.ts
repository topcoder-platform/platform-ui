import { WorkType } from "./work-type.enum"

export const WorkIntakeFormRoutes: { [workType: string]: ReadonlyArray<string> } = {
    // TODO: determine URL for Bug Hunt
    [WorkType.bugHunt]: [
        "/self-service/wizard",
        "/self-service/work/new/bug-hunt/basic-info",
        "/self-service",
        "/self-service",
        "/self-service/work/new/bug-hunt/login-prompt",
        "/self-service",
        "/self-service/work/new/bug-hunt/review",
        "/self-service/work/new/bug-hunt/thank-you",
    ]
}