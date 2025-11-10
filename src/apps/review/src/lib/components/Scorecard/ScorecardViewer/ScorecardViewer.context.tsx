import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
    AiFeedbackItem,
    AppealInfo,
    FormReviews,
    MappingAppeal,
    ReviewInfo,
    ReviewItemInfo,
    Scorecard,
} from '../../../models'
import { ReviewItemComment } from '../../../models/ReviewItemComment.model'

export interface ScorecardViewerContextProps {
    children: ReactNode;
    scorecard: Scorecard
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
};

const ScorecardViewerContext = createContext({} as ScorecardViewerContextValue)

export const ScorecardViewerContextProvider: FC<ScorecardViewerContextProps> = props => {
    const [toggledItems, setToggledItems] = useState<{[key: string]: boolean}>({})

    const toggleItem = useCallback((id: string, toggle?: boolean) => {
        setToggledItems(prevItems => ({
            ...prevItems,
            [id]: typeof toggle === 'boolean' ? toggle : !prevItems[id],
        }))
    }, [])

    // reset toggle state on scorecard change
    useEffect(() => setToggledItems({}), [props.scorecard])

    const ctxValue = useMemo(() => ({
        aiFeedbackItems: props.aiFeedbackItems,
        toggledItems,
        toggleItem,
        reviewInfo: props.reviewInfo,
        isEdit: props.isEdit,
        isManagerEdit: props.isManagerEdit,
        actionChallengeRole: props.actionChallengeRole,
        mappingAppeals: props.mappingAppeals,
        isSavingReview: props.isSavingReview,
        isSavingAppeal: props.isSavingAppeal,
        isSavingAppealResponse: props.isSavingAppealResponse,
        isSavingManagerComment: props.isSavingManagerComment,
        saveReviewInfo: props.saveReviewInfo,
        addAppeal: props.addAppeal,
        doDeleteAppeal: props.doDeleteAppeal,
        addAppealResponse: props.addAppealResponse,
        addManagerComment: props.addManagerComment,
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
        toggledItems,
        toggleItem,
    ])

    return (
        <ScorecardViewerContext.Provider
            value={ctxValue}
        >
            {props.children}
        </ScorecardViewerContext.Provider>
    )
}

export const useScorecardContext = (): ScorecardViewerContextValue => useContext(ScorecardViewerContext)
