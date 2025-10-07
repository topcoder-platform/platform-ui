import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { SSOLoginProvider } from '../models'

const baseUrl = `${EnvironmentConfig.API.V6}/identityproviders`

export const fetchSSOLoginProviders = async (): Promise<SSOLoginProvider[]> => xhrGetAsync<SSOLoginProvider[]>(
    `${baseUrl}/sso-providers`,
)
