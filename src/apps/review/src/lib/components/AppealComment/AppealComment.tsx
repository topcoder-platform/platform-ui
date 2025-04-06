/**
 * AppealComment.
 */
import { FC, useCallback, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import _ from 'lodash'
import classNames from 'classnames'

import { Button } from '~/libs/ui'
import { yupResolver } from '@hookform/resolvers/yup'

import { MarkdownReview } from '../MarkdownReview'
import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { AppealInfo, FormAppealResponse } from '../../models'
import { formAppealResponseSchema } from '../../utils'

import styles from './AppealComment.module.scss'

interface Props {
    className?: string
    data: AppealInfo
}

export const AppealComment: FC<Props> = (props: Props) => {
    const [appealResponse, setAppealResponse] = useState('')
    const [showResponseForm, setShowResponseForm] = useState(false)
    const [showAppealResponse, setShowAppealResponse] = useState(false)

    const {
        handleSubmit,
        control,
        formState: { errors },
    }: UseFormReturn<FormAppealResponse> = useForm({
        defaultValues: {
            response: '',
        },
        mode: 'all',
        resolver: yupResolver(formAppealResponseSchema),
    })

    const onSubmit = useCallback((data: FormAppealResponse) => {
        setAppealResponse(data.response)
        setShowResponseForm(false)
        setShowAppealResponse(true)
    }, [])

    return (
        <div className={classNames(styles.container, props.className)}>
            <div className={styles.blockAppealComment}>
                <span className={styles.textTitle}>Appeal Comment</span>
                <MarkdownReview value={props.data.content} />
            </div>
            {showAppealResponse && (
                <div className={styles.blockAppealResponse}>
                    <span className={styles.textTitle}>Appeal Response</span>
                    <MarkdownReview value={appealResponse} />
                </div>
            )}

            {!showResponseForm && !showAppealResponse && (
                <Button
                    secondary
                    size='lg'
                    label='Respond to Appeal'
                    onClick={function onClick() {
                        setShowResponseForm(true)
                    }}
                />
            )}

            {showResponseForm && (
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <Controller
                        name='response'
                        control={control}
                        render={function render(controlProps: {
                            field: ControllerRenderProps<
                                FormAppealResponse,
                                'response'
                            >
                        }) {
                            return (
                                <FieldMarkdownEditor
                                    className={styles.markdownEditor}
                                    onChange={controlProps.field.onChange}
                                    showBorder
                                    onBlur={controlProps.field.onBlur}
                                    error={_.get(errors, 'response.message')}
                                />
                            )
                        }}
                    />
                    <div className={styles.blockBtns}>
                        <Button
                            type='submit'
                            primary
                            size='lg'
                            label='Submit'
                        />
                        <Button
                            secondary
                            size='lg'
                            label='Cancel'
                            onClick={function onClick() {
                                setShowResponseForm(false)
                            }}
                        />
                    </div>
                </form>
            )}
        </div>
    )
}

export default AppealComment
