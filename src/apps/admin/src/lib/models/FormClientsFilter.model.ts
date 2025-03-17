/**
 * Model for clients filter form
 */
export interface FormClientsFilter {
    name?: string
    status?: string
    startDate?: Date | null
    endDate?: Date | null
}
