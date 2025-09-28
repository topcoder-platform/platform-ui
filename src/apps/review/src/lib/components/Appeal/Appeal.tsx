/**
 * AppealComment.
 */
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
    Controller,
    ControllerRenderProps,
    useForm,
    UseFormReturn,
} from 'react-hook-form'
import { get } from 'lodash'
import classNames from 'classnames'

import { yupResolver } from '@hookform/resolvers/yup'

import { MarkdownReview } from '../MarkdownReview'
import { FieldMarkdownEditor } from '../FieldMarkdownEditor'
import { AppealInfo, ChallengeDetailContextModel, FormAppealResponse } from '../../models'
import { formAppealResponseSchema, isAppealsPhase } from '../../utils'
import { ReviewItemComment } from '../../models/ReviewItemComment.model'
import { ChallengeDetailContext } from '../../contexts'

import styles from './Appeal.module.scss'

interface Props {
    className?: string
    appealInfo?: AppealInfo
    commentItem: ReviewItemComment
    isSavingAppeal: boolean
    addAppeal: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
}

export const AppealComment: FC<Props> = (props: Props) => {
    const className = props.className
    const appealInfo = props.appealInfo
    const commentItem = props.commentItem
    const isSavingAppeal = props.isSavingAppeal
    const addAppeal = props.addAppeal
    const doDeleteAppeal = props.doDeleteAppeal
    const [appealResponse, setAppealResponse] = useState('')
    const [showResponseForm, setShowResponseForm] = useState(false)

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const canAddAppeal = useMemo(() => isAppealsPhase(challengeInfo), [challengeInfo])

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
        addAppeal(data.response, commentItem, () => {
            setAppealResponse(data.response)
            setShowResponseForm(false)
        })
    }, [addAppeal, commentItem])

    useEffect(() => {
        if (appealInfo) {
            setAppealResponse(appealInfo.content)
        }
    }, [appealInfo])

    return (
        <div className={classNames(styles.container, className)}>
            {appealResponse && !showResponseForm && (
                <div className={styles.blockAppealComment}>
                    <span className={styles.textTitle}>Appeal Comment</span>
                    <MarkdownReview value={appealResponse} />
                    {canAddAppeal && (
                        <div className={styles.blockBtns}>
                            <button
                                onClick={function onClick() {
                                    setShowResponseForm(true)
                                }}
                                className='filledButton'
                                type='button'
                                disabled={isSavingAppeal}
                            >
                                Edit Appeal
                            </button>
                            <button
                                onClick={function onClick() {
                                    doDeleteAppeal(appealInfo, () => {
                                        setAppealResponse('')
                                    })
                                }}
                                type='button'
                                className='cancelButton'
                                disabled={isSavingAppeal}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            )}

            {!appealResponse && !showResponseForm && canAddAppeal && (
                <button
                    type='button'
                    className='borderButton'
                    onClick={function onClick() {
                        setShowResponseForm(true)
                    }}
                >
                    Add Appeal
                </button>
            )}

            {showResponseForm && (
                <form
                    className={styles.blockForm}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    <label>Submit Appeal</label>
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
                                    initialValue={appealResponse}
                                    className={styles.markdownEditor}
                                    onChange={controlProps.field.onChange}
                                    showBorder
                                    onBlur={controlProps.field.onBlur}
                                    error={get(errors, 'response.message')}
                                    disabled={isSavingAppeal}
                                />
                            )
                        }}
                    />
                    <div className={styles.blockBtns}>
                        <button
                            disabled={isSavingAppeal}
                            className='filledButton'
                            type='submit'
                        >
                            Submit Appeal
                        </button>
                        <button
                            type='button'
                            className='borderButton'
                            onClick={function onClick() {
                                setShowResponseForm(false)
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default AppealComment
