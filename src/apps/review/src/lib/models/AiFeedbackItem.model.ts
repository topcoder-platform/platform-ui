export interface AiFeedbackItem {
    id: string
    content: string
    upVotes: number
    downVotes: number
    questionScore: number
    comments: string[]
    scorecardQuestionId: string
}
