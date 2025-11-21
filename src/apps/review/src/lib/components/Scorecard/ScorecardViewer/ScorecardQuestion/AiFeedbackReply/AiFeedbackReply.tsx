import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { get } from 'lodash'
import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'
import { formFeedbackReplySchema } from '~/apps/review/src/lib/utils'
import { FormFeedbackReply } from '~/apps/review/src/lib/models/FormFeedbackReply.model'

import { FieldMarkdownEditor } from '../../../../FieldMarkdownEditor'

import styles from './AiFeedbackReply.module.scss'

interface AiFeedbackReplyProps {
    onCloseReply: () => void
    onSubmitReply: (content: string) => Promise<void>
}

export const AiFeedbackReply: FC<AiFeedbackReplyProps> = props => {
    const [reply, setReply] = useState('')
    const [isSavingReply, setSavingReply] = useState(false)
    const {
        handleSubmit,
        control,
        formState: { errors },
    }: UseFormReturn<FormFeedbackReply> = useForm({
        defaultValues: {
            reply: '',
        },
        mode: 'all',
        resolver: yupResolver(formFeedbackReplySchema),
    })

    const onSubmit = useCallback(async (data: FormFeedbackReply) => {
        setSavingReply(true)
        await props.onSubmitReply(data.reply)
        setReply('')
        setSavingReply(false)
    }, [props.onSubmitReply, setReply])

    return (
        <div className={styles.replyWrapper}>
            <div className={styles.title}>Reply</div>
            <form
                className={styles.blockForm}
                onSubmit={handleSubmit(onSubmit)}
            >
                <Controller
                    name='reply'
                    control={control}
                    render={function render(controlProps: {
                        field: ControllerRenderProps<
                            FormFeedbackReply,
                            'reply'
                        >
                    }) {
                        return (
                            <FieldMarkdownEditor
                                initialValue={reply}
                                className={styles.markdownEditor}
                                onChange={controlProps.field.onChange}
                                showBorder
                                onBlur={controlProps.field.onBlur}
                                error={get(errors, 'reply.message')}
                                disabled={isSavingReply}
                                uploadCategory='appeal'
                                maxCharactersAllowed={10}
                            />
                        )
                    }}
                />
                <div className={styles.blockBtns}>
                    <button
                        disabled={isSavingReply}
                        className='filledButton'
                        type='submit'
                    >
                        Submit Reply
                    </button>
                    <button
                        type='button'
                        className={classNames('borderButton', styles.cancelButton)}
                        onClick={function onClick() {
                            props.onCloseReply()
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
