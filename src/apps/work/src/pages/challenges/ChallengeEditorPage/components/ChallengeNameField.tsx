import { FC } from 'react'

import { FormTextField } from '../../../../lib/components/form'
import { MAX_CHALLENGE_NAME_LENGTH } from '../../../../lib/constants/challenge-editor.constants'
import { sanitizeChallengeName } from '../../../../lib/utils'

export const ChallengeNameField: FC = () => (
    <FormTextField
        label='Challenge Name'
        maxLength={MAX_CHALLENGE_NAME_LENGTH}
        name='name'
        placeholder='Challenge Name'
        required
        sanitize={sanitizeChallengeName}
    />
)

export default ChallengeNameField
