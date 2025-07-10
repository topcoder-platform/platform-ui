/**
 * Terms Filters.
 */
import { FC, useCallback } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button, InputText } from '~/libs/ui'

import { formSearchByKeySchema } from '../../utils'
import { FormSearchByKey } from '../../models'

import styles from './TermsFilters.module.scss'

interface Props {
    className?: string
    isLoading: boolean
    onSubmitForm?: (data: FormSearchByKey) => void
}

const defaultValues: FormSearchByKey = {
    searchKey: '',
}

export const TermsFilters: FC<Props> = (props: Props) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { isValid, isDirty },
    }: UseFormReturn<FormSearchByKey> = useForm({
        defaultValues,
        mode: 'all',
        resolver: yupResolver(formSearchByKeySchema),
    })

    /**
     * Handle submit form event
     */
    const onSubmit = useCallback(
        (data: FormSearchByKey) => {
            props.onSubmitForm?.(data)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.onSubmitForm],
    )

    return (
        <form
            className={classNames(styles.container, props.className)}
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className={styles.fields}>
                <InputText
                    type='text'
                    name='searchKey'
                    label='Title'
                    placeholder='Enter'
                    tabIndex={0}
                    onChange={_.noop}
                    classNameWrapper={styles.field}
                    inputControl={register('searchKey')}
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
                        onClick={function onClick() {
                            reset(defaultValues)
                            setTimeout(() => {
                                onSubmit(defaultValues)
                            })
                        }}
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

export default TermsFilters
