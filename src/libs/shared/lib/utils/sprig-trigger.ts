import { sprig, SprigAPI } from '@sprig-technologies/sprig-browser'
import { EnvironmentConfig } from '~/config'

const sprigEnvId: string | undefined = EnvironmentConfig.SPRIG.ENVIRONMENT_ID

const Sprig: SprigAPI | undefined = sprigEnvId ? sprig.configure({
    environmentId: EnvironmentConfig.SPRIG.ENVIRONMENT_ID,
}) : undefined

export function sprigTriggerForUser(surveyName: string, userId?: number): void {

    if (!userId) {
        Sprig?.track(surveyName)
        return
    }

    Sprig?.identifyAndTrack({
        anonymousId: '',
        eventName: surveyName,
        metadata: undefined,
        userId: `${userId}`,
    })
}
