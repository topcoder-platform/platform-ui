import { sprig, SprigAPI } from '@sprig-technologies/sprig-browser'
import { EnvironmentConfig } from '~/config'

const Sprig: SprigAPI = sprig.configure({
    environmentId: EnvironmentConfig.SPRIG.ENVIRONMENT_ID,
})

export function triggerForUser(surveyName: string, userId?: number): void {

    if (!userId) {
        Sprig.track(surveyName)
        return
    }

    Sprig.identifyAndTrack({
        anonymousId: '',
        eventName: surveyName,
        metadata: undefined,
        userId: `${userId}`,
    })
}
