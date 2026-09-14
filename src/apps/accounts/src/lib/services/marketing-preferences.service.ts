import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPutAsync } from '~/libs/core'

export interface MarketingSubscription {
    active: boolean
    description: string
    name: string
    source: string
    subscribed: boolean
    subscriptionTypeId: string
}

export interface MarketingPreferences {
    memberId: string
    subscriptions: MarketingSubscription[]
    suppressed: boolean
}

const preferencesUrl: string = `${EnvironmentConfig.CONTACT_API}/me/subscriptions`

/**
 * Loads the authenticated member's current email category choices in Accounts settings.
 * @returns Recorded choices and delivery suppression state, without inferring subscriptions.
 * @throws Rejects when the authenticated Contact API request fails.
 */
export async function getMarketingPreferences(): Promise<MarketingPreferences> {
    return xhrGetAsync<MarketingPreferences>(preferencesUrl)
}

/**
 * Saves the member's complete selection of active marketing email categories.
 * @param subscriptionTypeIds Selected category IDs; an empty array opts out of every active category.
 * @returns The server's saved preferences; identity is derived from the member JWT.
 * @throws Rejects when authentication, category validation or persistence fails.
 */
export async function saveMarketingPreferences(subscriptionTypeIds: string[]): Promise<MarketingPreferences> {
    return xhrPutAsync<{ subscriptionTypeIds: string[] }, MarketingPreferences>(
        preferencesUrl,
        { subscriptionTypeIds },
    )
}
