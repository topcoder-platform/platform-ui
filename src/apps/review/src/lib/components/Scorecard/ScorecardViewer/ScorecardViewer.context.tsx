import { createContext, FC, ReactNode, useContext, useMemo } from 'react'
import { FieldErrors, UseFormReturn, UseFormTrigger } from 'react-hook-form'

import {
    AiFeedbackItem,
    AppealInfo,
    FormReviews,
    MappingAppeal,
    ReviewCtxStatus,
    ReviewInfo,
    ReviewItemInfo,
    Scorecard,
    ScorecardInfo,
} from '../../../models'
import { ReviewItemComment } from '../../../models/ReviewItemComment.model'

import { useProgressCalculation, UseProgressCalculationValue } from './hooks/useProgressCalculation'
import { useReviewForm } from './hooks/useReviewForm'
import { useToggleItems } from './hooks/useToggleItems'

export interface ScorecardViewerContextProps {
    children: ReactNode;
    scorecard: Scorecard | ScorecardInfo
    aiFeedbackItems?: AiFeedbackItem[]
    reviewInfo?: ReviewInfo
    isEdit?: boolean
    isManagerEdit?: boolean
    actionChallengeRole?: string
    mappingAppeals?: MappingAppeal
    isSavingReview?: boolean
    isSavingAppeal?: boolean
    isSavingAppealResponse?: boolean
    isSavingManagerComment?: boolean
    setReviewStatus?: (status: ReviewCtxStatus) => void
    saveReviewInfo?: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    addAppeal?: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal?: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse?: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment?: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    onFormChange?: (isDirty: boolean) => void
}

export type ScorecardViewerContextValue = {
    aiFeedbackItems?: AiFeedbackItem[]
    toggledItems: {[key: string]: boolean}
    toggleItem: (id: string, toggle?: boolean) => void
    reviewInfo?: ReviewInfo
    isEdit?: boolean
    isManagerEdit?: boolean
    actionChallengeRole?: string
    mappingAppeals?: MappingAppeal
    isSavingReview?: boolean
    isSavingAppeal?: boolean
    isSavingAppealResponse?: boolean
    isSavingManagerComment?: boolean
    setReviewStatus?: (status: ReviewCtxStatus) => void
    saveReviewInfo?: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    addAppeal?: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal?: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse?: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment?: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    // Form control related
    form?: UseFormReturn<FormReviews>
    isTouched: { [key: string]: boolean }
    setIsTouched: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
    recalculateReviewProgress: () => void
    touchedAllFields: () => void
    formErrors?: FieldErrors<FormReviews>
    formTrigger?: UseFormTrigger<FormReviews>
} & UseProgressCalculationValue;

const ScorecardViewerContext = createContext({} as ScorecardViewerContextValue)

export const ScorecardViewerContextProvider: FC<ScorecardViewerContextProps> = props => {
    const collapsiblesCtx = useToggleItems({ scorecard: props.scorecard })

    const reviewFormCtx = useReviewForm({
        onFormChange: props.onFormChange,
        reviewItems: props.reviewInfo?.reviewItems ?? props.aiFeedbackItems ?? [],
        scorecardInfo: props.scorecard,
    })

    const progressCtx = useProgressCalculation({
        form: reviewFormCtx.form,
        scorecard: props.scorecard,
    })

    const ctxValue = useMemo(() => ({
        ...collapsiblesCtx,
        ...reviewFormCtx,
        ...progressCtx,
        actionChallengeRole: props.actionChallengeRole,
        addAppeal: props.addAppeal,
        addAppealResponse: props.addAppealResponse,
        addManagerComment: props.addManagerComment,
        aiFeedbackItems: props.aiFeedbackItems,
        doDeleteAppeal: props.doDeleteAppeal,
        form: props.isEdit ? reviewFormCtx.form : undefined,
        formErrors: props.isEdit ? reviewFormCtx.form.formState.errors : undefined,
        formTrigger: props.isEdit ? reviewFormCtx.form.trigger : undefined,
        isEdit: props.isEdit,
        isManagerEdit: props.isManagerEdit,
        isSavingAppeal: props.isSavingAppeal,
        isSavingAppealResponse: props.isSavingAppealResponse,
        isSavingManagerComment: props.isSavingManagerComment,
        isSavingReview: props.isSavingReview,
        isTouched: reviewFormCtx.isTouched,
        mappingAppeals: props.mappingAppeals,
        reviewInfo: props.reviewInfo,
        saveReviewInfo: props.saveReviewInfo,
        setIsTouched: reviewFormCtx.setIsTouched,
        setReviewStatus: props.setReviewStatus,
        touchedAllFields: reviewFormCtx.touchedAllFields,
    }), [
        props.aiFeedbackItems,
        props.reviewInfo,
        props.isEdit,
        props.isManagerEdit,
        props.actionChallengeRole,
        props.mappingAppeals,
        props.isSavingReview,
        props.isSavingAppeal,
        props.isSavingAppealResponse,
        props.isSavingManagerComment,
        props.saveReviewInfo,
        props.addAppeal,
        props.doDeleteAppeal,
        props.addAppealResponse,
        props.addManagerComment,
        props.setReviewStatus,
        collapsiblesCtx.toggledItems,
        reviewFormCtx,
        progressCtx,
    ])

    return (
        <ScorecardViewerContext.Provider
            value={ctxValue}
        >
            {props.children}
        </ScorecardViewerContext.Provider>
    )
}

export const useScorecardViewerContext = (): ScorecardViewerContextValue => useContext(ScorecardViewerContext)
