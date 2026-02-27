import { FC, useContext } from 'react'
import { generatePath, Link } from 'react-router-dom'
import moment from 'moment'

import { profileContext, ProfileContextData } from '~/libs/core'
import { LoadingSpinner } from '~/libs/ui'

import {
    challengeListingRouteId,
    rootRoute,
    submissionManagementRouteId,
} from '../../../../config/routes.config'
import {
    SubmissionInfo,
    useMemberSubmissions,
    UseMemberSubmissionsResult,
} from '../../../../lib'

import styles from './MySubmissionsPanel.module.scss'

interface ExtendedSubmissionInfo extends SubmissionInfo {
    challenge?: {
        name?: string
    }
    challengeName?: string
}

function withLeadingSlash(path: string): string {
    return path.startsWith('/')
        ? path
        : `/${path}`
}

function getChallengeName(submission: SubmissionInfo): string {
    const extendedSubmission = submission as ExtendedSubmissionInfo

    return extendedSubmission.challengeName
        || extendedSubmission.challenge?.name
        || submission.challengeId
}

function formatSubmissionDate(createdAt: string): string {
    const value = moment(createdAt)

    return value.isValid()
        ? value.format('MMM DD, YYYY')
        : '-'
}

/**
 * Displays the logged-in member's recent submissions.
 *
 * @returns Member submissions panel or an empty fragment when not logged in.
 */
const MySubmissionsPanel: FC = () => {
    const { isLoggedIn }: ProfileContextData = useContext(profileContext)
    const {
        isLoading,
        submissions,
    }: UseMemberSubmissionsResult = useMemberSubmissions()

    if (!isLoggedIn) {
        return <></>
    }

    const listingPath = withLeadingSlash(`${rootRoute}/${challengeListingRouteId}`)
        .replace(/\/{2,}/g, '/')
    const myBucketPath = `${listingPath}?bucket=my`

    return (
        <section className={styles.container}>
            <header className={styles.header}>
                <h2 className={styles.title}>My Submissions</h2>
                <Link className={styles.viewAll} to={myBucketPath}>View all</Link>
            </header>

            {isLoading && (
                <div className={styles.loading}>
                    <LoadingSpinner inline />
                </div>
            )}

            {!isLoading && !submissions.length && (
                <p className={styles.emptyState}>No submissions yet</p>
            )}

            {!isLoading && submissions.length > 0 && (
                <div className={styles.rows}>
                    {submissions.map(submission => {
                        const submissionPath = withLeadingSlash(
                            `${rootRoute}/${generatePath(submissionManagementRouteId, {
                                challengeId: submission.challengeId,
                            })}`,
                        )
                            .replace(/\/{2,}/g, '/')

                        return (
                            <article className={styles.row} key={submission.id}>
                                <div className={styles.details}>
                                    <p className={styles.challengeName}>{getChallengeName(submission)}</p>
                                    <p className={styles.date}>
                                        Submitted
                                        {' '}
                                        {formatSubmissionDate(submission.created)}
                                    </p>
                                </div>
                                <Link className={styles.submissionsLink} to={submissionPath}>View</Link>
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}

export default MySubmissionsPanel
