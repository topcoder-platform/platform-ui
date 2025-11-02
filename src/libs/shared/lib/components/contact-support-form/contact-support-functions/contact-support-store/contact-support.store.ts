import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

import { ContactSupportRequest } from './contact-support-request.model'

export async function submitRequestAsync(request: ContactSupportRequest): Promise<void> {
    const url: string = `${EnvironmentConfig.API.V6}/challenges/support-requests`
    await xhrPostAsync(url, request)
}
