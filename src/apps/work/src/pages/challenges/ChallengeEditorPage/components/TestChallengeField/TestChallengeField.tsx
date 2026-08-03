import { FC } from 'react'

import { FormCheckboxField } from '../../../../../lib/components/form'

interface TestChallengeFieldProps {
    disabled?: boolean
}

/**
 * Renders the production test-challenge toggle used during challenge setup and editing.
 *
 * @param props field state supplied by the challenge editor, including read-only disablement.
 * @returns A checkbox bound to the editor's `isTestChallenge` form value.
 * @remarks Challenge metadata hydration and serialization are handled by the editor mapping utils.
 * @throws Does not throw.
 */
export const TestChallengeField: FC<TestChallengeFieldProps> = (
    props: TestChallengeFieldProps,
) => (
    <FormCheckboxField
        checkboxOnlyHitArea
        disabled={props.disabled}
        hint='Test challenges can be deleted after use and do not generate payments.'
        label='Test Challenge'
        name='isTestChallenge'
    />
)

export default TestChallengeField
