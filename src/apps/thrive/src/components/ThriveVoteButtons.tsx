import type { FC } from 'react'
import { useCallback, useContext, useEffect, useState } from 'react'

import { authUrlLogin, profileContext, ProfileContextData } from '~/libs/core'

import { castThriveVote, getThriveVote, ThriveVoteState } from '../services/thrive-votes.service'
import styles from '../Thrive.module.scss'

/** Displayed totals plus the member's vote, which is undefined until it has loaded. */
interface DisplayedVoteState extends Omit<ThriveVoteState, 'vote'> {
    vote?: ThriveVoteState['vote']
}

interface ThriveVoteButtonsProps {
    articleId: string
    downvotes: number
    upvotes: number
}

/**
 * Lets signed-in members like or dislike a Thrive article through the website vote API.
 *
 * Shows the published totals immediately, then loads the member's own vote and the live totals.
 * Selecting the active vote again clears it; selecting the other vote switches it. Signed-out
 * members are sent to login with this article as the return URL. Used by `ThriveArticlePage`.
 *
 * @param props article entry identifier and its published totals.
 * @returns accessible toggle buttons with counts and an inline error message.
 * @throws Does not throw; request failures render a message and keep the previous state.
 */
export const ThriveVoteButtons: FC<ThriveVoteButtonsProps> = (props: ThriveVoteButtonsProps) => {
    const { initialized, profile }: ProfileContextData = useContext(profileContext)
    const [state, setState] = useState<DisplayedVoteState>({ downvotes: props.downvotes, upvotes: props.upvotes })
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setState({ downvotes: props.downvotes, upvotes: props.upvotes })
        setError('')
        if (!initialized || !profile) return undefined
        let active = true
        getThriveVote(props.articleId)
            .then(result => { if (active) setState(result) })
            .catch(() => undefined)
        return () => { active = false }
    }, [initialized, profile, props.articleId, props.downvotes, props.upvotes])

    /** Toggles one vote for the signed-in member, or starts login for visitors. */
    const vote = useCallback(async (choice: 'up' | 'down'): Promise<void> => {
        if (!profile) {
            window.location.assign(authUrlLogin(window.location.href))
            return
        }

        setBusy(true)
        setError('')
        try {
            setState(await castThriveVote(props.articleId, state.vote === choice ? 'none' : choice))
        } catch (failure) {
            setError(failure instanceof Error ? failure.message : 'We could not save your vote. Please try again.')
        } finally {
            setBusy(false)
        }
    }, [profile, props.articleId, state.vote])
    const voteUp = useCallback(() => vote('up'), [vote])
    const voteDown = useCallback(() => vote('down'), [vote])

    return (
        <div className={styles.voteSummary}>
            <button
                aria-label={`Like this article (${state.upvotes} likes)`}
                aria-pressed={state.vote === 'up'}
                className={styles.voteButton}
                disabled={busy || !initialized}
                onClick={voteUp}
                type='button'
            >
                {state.vote === 'up' ? '♥' : '♡'}
                {' '}
                {state.upvotes}
            </button>
            <button
                aria-label={`Dislike this article (${state.downvotes} dislikes)`}
                aria-pressed={state.vote === 'down'}
                className={styles.voteButton}
                disabled={busy || !initialized}
                onClick={voteDown}
                type='button'
            >
                {state.vote === 'down' ? '▼' : '▽'}
                {' '}
                {state.downvotes}
            </button>
            {error && <p className={styles.voteError} role='alert'>{error}</p>}
        </div>
    )
}
