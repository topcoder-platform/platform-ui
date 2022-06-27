import { EnvironmentConfig } from '../../../../config'
import { xhrPostAsync } from '../../../functions'

import { ContactSupportRequest } from './contact-support-request.model'

export async function submitRequestAsync(request: ContactSupportRequest): Promise<void> {
    const url: string = `${EnvironmentConfig.API.V5}/challenges/support-requests`
    await xhrPostAsync(url, request)
}
