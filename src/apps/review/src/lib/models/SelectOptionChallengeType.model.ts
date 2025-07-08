import { SelectOption } from './SelectOption.model'

export interface SelectOptionChallengeType extends SelectOption {
    isDisabled?: boolean
    challengeTypeId?: string
    challengeTrackId?: string
}
