/**
 * Model for terms users filter form
 */
export interface FormTermsUsersFilter {
    userId?: string
    handle?: string
    signTermsFrom?: Date | null
    signTermsTo?: Date | null
}
