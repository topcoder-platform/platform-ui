import { useCallback } from 'react'
import type { FC } from 'react'
import { useForm } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button, InputText } from '~/libs/ui'

import { formSearchDefaultReviewersSchema } from '../../utils'
import { FormSearchDefaultReviewers } from '../../models'

import styles from './DefaultReviewersFilters.module.scss'

interface Props {
    className?: string
    isLoading: boolean
    onSubmitForm?: (data: FormSearchDefaultReviewers) => void
}

const defaultValues: FormSearchDefaultReviewers = {
    phaseName: '',
}

export const DefaultReviewersFilters: FC<Props> = (props: Props) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { isValid, isDirty },
    }: UseFormReturn<FormSearchDefaultReviewers> = useForm({
        defaultValues,
        mode: 'all',
        resolver: yupResolver(formSearchDefaultReviewersSchema),
    })

    const onSubmit = useCallback(
        (data: FormSearchDefaultReviewers) => {
            props.onSubmitForm?.(data)
        },
        [props.onSubmitForm],
    )

    const handleReset = useCallback(() => {
        reset(defaultValues)
        setTimeout(() => {
            onSubmit(defaultValues)
        })
    }, [reset, onSubmit])

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={styles.fields}>
                <InputText
                    type='text'
                    name='phaseName'
                    label='Phase Name'
                    placeholder='Enter phase name'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('phaseName')}
                    disabled={props.isLoading}
                />
                <div className={styles.blockBottom}>
                    <Button
                        primary
                        className={styles.searchButton}
                        size='lg'
                        type='submit'
                        disabled={!isValid || props.isLoading}
                    >
                        Filter
                    </Button>
                    <Button
                        secondary
                        onClick={handleReset}
                        size='lg'
                        disabled={!isDirty}
                    >
                        Reset
                    </Button>
                </div>
            </div>
        </form>
    )
}

export default DefaultReviewersFilters
