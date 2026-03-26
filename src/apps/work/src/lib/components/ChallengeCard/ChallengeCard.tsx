import { FC, MouseEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    COMMUNITY_APP_URL,
    REVIEW_APP_URL,
} from '../../constants'
import {
    Challenge,
    ChallengeType,
} from '../../models'
import {
    formatDate,
    getCurrentPhase,
    getStatusText,
} from '../../utils'
import { ChallengeStatus } from '../ChallengeStatus'
import { ChallengeTag } from '../ChallengeTag'

import styles from './ChallengeCard.module.scss'

interface ChallengeCardProps {
    challenge: Challenge
    challengeTypes: ChallengeType[]
    onChallengeClick?: (challenge: Challenge) => void
}

function getForumLink(challenge: Challenge): string | undefined {
    return challenge.discussions?.find(discussion => !!discussion.url)?.url
}

export const ChallengeCard: FC<ChallengeCardProps> = (props: ChallengeCardProps) => {
    const challenge: Challenge = props.challenge
    const challengeTypes: ChallengeType[] = props.challengeTypes
    const onChallengeClick: ((challenge: Challenge) => void) | undefined = props.onChallengeClick

    const navigate = useNavigate()

    const challengeProjectId = challenge.projectId
        ? String(challenge.projectId)
        : undefined

    const challengeViewPath = challengeProjectId
        ? `/projects/${challengeProjectId}/challenges/${challenge.id}/view`
        : `/challenges/${challenge.id}`

    const challengeEditPath = `/challenges/${challenge.id}/edit`

    const forumLink = useMemo(() => getForumLink(challenge), [challenge])

    const reviewLink = `${REVIEW_APP_URL}/active-challenges/${challenge.id}/challenge-details`
    const communityLink = `${COMMUNITY_APP_URL}/challenges/${challenge.id}`

    function handleChallengeNameClick(event: MouseEvent<HTMLButtonElement>): void {
        event.preventDefault()
        onChallengeClick?.(challenge)
        navigate(challengeViewPath)
    }

    function handleEditClick(event: MouseEvent<HTMLButtonElement>): void {
        event.preventDefault()
        navigate(challengeEditPath)
    }

    return (
        <tr className={styles.row}>
            <td>
                <ChallengeTag
                    type={challenge.type as string | { id?: string; name?: string; abbreviation?: string }}
                    challengeTypes={challengeTypes}
                />
            </td>
            <td>
                <button
                    type='button'
                    className={styles.challengeName}
                    onClick={handleChallengeNameClick}
                >
                    {challenge.name}
                </button>
            </td>
            <td>{formatDate(challenge.startDate)}</td>
            <td>{formatDate(challenge.endDate)}</td>
            <td>{challenge.numOfRegistrants ?? 0}</td>
            <td>{challenge.numOfSubmissions ?? 0}</td>
            <td>
                <ChallengeStatus
                    status={challenge.status}
                    statusText={getStatusText(challenge.status)}
                />
            </td>
            <td>{getCurrentPhase(challenge)}</td>
            <td>
                <div className={styles.actions}>
                    <button
                        type='button'
                        onClick={handleEditClick}
                        className={styles.actionButton}
                    >
                        Edit
                    </button>
                    <a
                        href={reviewLink}
                        target='_blank'
                        rel='noreferrer'
                        className={styles.actionLink}
                    >
                        Review
                    </a>
                    <a
                        href={communityLink}
                        target='_blank'
                        rel='noreferrer'
                        className={styles.actionLink}
                    >
                        CA
                    </a>
                    {forumLink
                        ? (
                            <a
                                href={forumLink}
                                target='_blank'
                                rel='noreferrer'
                                className={styles.actionLink}
                            >
                                Forum
                            </a>
                        )
                        : <span className={styles.disabledAction}>Forum</span>}
                </div>
            </td>
        </tr>
    )
}

export default ChallengeCard
