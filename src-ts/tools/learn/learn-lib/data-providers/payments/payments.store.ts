import { xhrPostAsync } from '../../../../../lib'
import { learnUrlGet } from '../../functions'

import { MemberEnrollPaymentRequest, MemberEnrollPaymentSheet } from './member-enroll-payment.model'

export async function createMemberEnrollPaymentAsync(
    request: MemberEnrollPaymentRequest,
): Promise<MemberEnrollPaymentSheet> {
    const url: string = learnUrlGet(
        'payments',
        'stripe',
    )
    return xhrPostAsync(url, JSON.stringify(request))
}
