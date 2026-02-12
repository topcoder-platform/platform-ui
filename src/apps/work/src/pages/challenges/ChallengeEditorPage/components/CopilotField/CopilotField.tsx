import {
    FC,
    useCallback,
    useContext,
    useEffect,
} from 'react'
import {
    useFormContext,
    useWatch,
} from 'react-hook-form'
import type {
    UseFormReturn,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import { FormUserAutocomplete } from '../../../../../lib/components/form'
import { WorkAppContext } from '../../../../../lib/contexts'
import {
    PRIZE_SET_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    PrizeSet,
    WorkAppContextModel,
} from '../../../../../lib/models'

import styles from './CopilotField.module.scss'

const COPILOT_REQUIRED_MESSAGE = 'Copilot is required when copilot fee is greater than 0'

function getCopilotFee(prizeSets: PrizeSet[] | undefined): number {
    if (!Array.isArray(prizeSets)) {
        return 0
    }

    return Number(
        prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.COPILOT)
            ?.prizes?.[0]
            ?.value,
    ) || 0
}

export const CopilotField: FC = () => {
    const {
        loginUserInfo,
    }: WorkAppContextModel = useContext(WorkAppContext)

    const {
        clearErrors,
        control,
        getFieldState,
        setError,
        setValue,
    }: Pick<UseFormReturn<ChallengeEditorFormData>,
        'clearErrors'
        | 'control'
        | 'getFieldState'
        | 'setError'
        | 'setValue'
    > = useFormContext<ChallengeEditorFormData>()

    const copilot = useWatch({
        control,
        name: 'copilot',
    }) as string | undefined
    const prizeSets = useWatch({
        control,
        name: 'prizeSets',
    }) as PrizeSet[] | undefined

    useEffect(() => {
        const copilotFee = getCopilotFee(prizeSets)
        const normalizedCopilot = typeof copilot === 'string'
            ? copilot.trim()
            : ''
        const copilotError = getFieldState('copilot').error

        if (copilotFee > 0 && !normalizedCopilot) {
            if (
                copilotError?.type !== 'manual'
                || copilotError.message !== COPILOT_REQUIRED_MESSAGE
            ) {
                setError('copilot', {
                    message: COPILOT_REQUIRED_MESSAGE,
                    type: 'manual',
                })
            }

            return
        }

        if (
            copilotError?.type === 'manual'
            && copilotError.message === COPILOT_REQUIRED_MESSAGE
        ) {
            clearErrors('copilot')
        }
    }, [clearErrors, copilot, getFieldState, prizeSets, setError])

    const assignYourself = useCallback((): void => {
        const currentUserHandle = loginUserInfo?.handle

        if (!currentUserHandle) {
            return
        }

        setValue('copilot', currentUserHandle, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [loginUserInfo?.handle, setValue])

    return (
        <div className={styles.container}>
            <FormUserAutocomplete
                label='Copilot'
                name='copilot'
                placeholder='Search copilot'
                valueField='handle'
            />
            <div className={styles.actions}>
                <Button
                    disabled={!loginUserInfo?.handle}
                    label='Assign yourself'
                    onClick={assignYourself}
                    secondary
                />
            </div>
            {copilot
                ? (
                    <div className={styles.info}>
                        Selected copilot:
                        {' '}
                        {copilot}
                    </div>
                )
                : undefined}
        </div>
    )
}

export default CopilotField
