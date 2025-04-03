import { SelectOption } from './SelectOption.model'

/**
 * Model for add resource form
 */
export interface FormAddResource {
    userId: string
    handle: SelectOption
    resourceRole: SelectOption
}
