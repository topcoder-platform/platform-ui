/**
 * Normalized SendGrid email activity returned for a member.
 */
export interface MemberSendgridEmail {
    subject: string
    fromEmail: string
    toEmail: string
    status: string
    timestamp: string
}
