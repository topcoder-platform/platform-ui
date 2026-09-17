import { ChallengeOpportunity } from '../models'

/**
 * Identifies Task challenges across canonical and legacy Challenge API shapes.
 *
 * @param challenge raw Challenge API detail response, when available.
 * @returns true for the Task catalog type or either legacy task flag.
 * @throws Does not throw; absent and malformed type data is treated as non-Task.
 */
export function isTaskChallenge(challenge?: ChallengeOpportunity): boolean {
    if (!challenge) return false
    const typeName = typeof challenge.type === 'string'
        ? challenge.type
        : challenge.type?.name
    const typeKey = typeName?.trim()
        .replace(/[^a-z0-9]+/gi, '')
        .toLowerCase()

    const taskFlag = challenge.task?.isTask ?? challenge.taskIsTask
    return typeKey === 'task'
        || taskFlag === true
        || challenge.legacy?.pureV5Task === true
}
