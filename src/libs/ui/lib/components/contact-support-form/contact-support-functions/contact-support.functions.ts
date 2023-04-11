import { ContactSupportRequest, contactSupportSubmitRequestAsync } from './contact-support-store'

export async function submitRequestAsync(request: ContactSupportRequest): Promise<void> {
    return contactSupportSubmitRequestAsync(request)
}
