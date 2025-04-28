import _ from 'lodash'

import { ReviewResult } from '../models'

export function getFinalScore(reviews: ReviewResult[] | undefined): string {
    if (!reviews) return '0'
    return (_.sumBy(reviews, 'score') / reviews.length ?? 1).toFixed(2)
}
