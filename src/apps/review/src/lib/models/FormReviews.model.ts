/**
 * Form Reviews
 */
export interface FormReviewComment {
    id?: string
    content?: string
    type?: string
    index: number
}
export interface FormReviewItem {
    id: string
    scorecardQuestionId: string
    initialAnswer: string
    index: number
    comments: FormReviewComment[]
}
export interface FormReviews {
    reviews: FormReviewItem[]
}
