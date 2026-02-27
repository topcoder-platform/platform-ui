import { FC, useMemo } from 'react'
import DOMPurify from 'dompurify'

import { EnvironmentConfig } from '~/config'

import {
    ChallengeInfo,
    CommunityMeta,
    getForumLink,
    isDesignChallenge,
} from '../../../../lib'

import styles from './Specification.module.scss'

interface SpecificationProps {
    challenge: ChallengeInfo
    communityMeta?: CommunityMeta
}

interface SideBarProps {
    challenge: ChallengeInfo
    forumLink?: string
    isWipro: boolean
}

function getMetadataValue(metadata: Record<string, unknown>, key: string): string {
    const metadataRecord = metadata as Record<string, unknown>

    if (Array.isArray(metadataRecord)) {
        const item = metadataRecord.find(entry => (
            typeof entry === 'object'
            && entry !== null
            && (entry as { name?: string }).name === key
        )) as { value?: string } | undefined

        return item?.value ?? ''
    }

    const value = metadataRecord[key]

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number') {
        return `${value}`
    }

    if (typeof value === 'boolean') {
        return `${value}`
    }

    return ''
}

function getScorecardId(challenge: ChallengeInfo, phaseName: string): string {
    const phase = challenge.phases.find(item => item.name === phaseName)

    if (!phase?.constraints) {
        return ''
    }

    const scorecard = phase.constraints.find(constraint => (
        typeof constraint.name === 'string'
        && constraint.name === 'Scorecard'
    )) as { value?: string | number } | undefined

    if (!scorecard?.value) {
        return ''
    }

    return `${scorecard.value}`
}

function normalizeGroupIds(groups: Array<Record<string, unknown>>): string[] {
    return groups.map(group => {
        if (typeof group === 'string') {
            return group
        }

        if (typeof group.groupId === 'string') {
            return group.groupId
        }

        if (typeof group.id === 'string') {
            return group.id
        }

        return ''
    })
        .filter(Boolean)
}

const SideBar: FC<SideBarProps> = (props: SideBarProps) => {
    const environment = getMetadataValue(props.challenge.metadata, 'environment')
    const codeRepo = getMetadataValue(props.challenge.metadata, 'codeRepo')
    const reviewScorecardId = getScorecardId(props.challenge, 'Review')
    const screeningScorecardId = getScorecardId(props.challenge, 'Screening')
    const scorecardBaseUrl = `${EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL}/actions/ViewScorecard?scid=`
    const eventName = props.challenge.events?.[0]?.eventName

    return (
        <aside className={styles.sideBar}>
            <h3 className={styles.sideBarTitle}>Challenge Links</h3>

            {props.forumLink && (
                <a className={styles.sideBarLink} href={props.forumLink} rel='noreferrer' target='_blank'>
                    Challenge Discussion
                </a>
            )}

            {screeningScorecardId && (
                <a
                    className={styles.sideBarLink}
                    href={`${scorecardBaseUrl}${screeningScorecardId}`}
                    rel='noreferrer'
                    target='_blank'
                >
                    Screening Scorecard
                </a>
            )}

            {reviewScorecardId && (
                <a
                    className={styles.sideBarLink}
                    href={`${scorecardBaseUrl}${reviewScorecardId}`}
                    rel='noreferrer'
                    target='_blank'
                >
                    Review Scorecard
                </a>
            )}

            {environment && (
                <a className={styles.sideBarLink} href={environment} rel='noreferrer' target='_blank'>
                    Environment
                </a>
            )}

            {codeRepo && (
                <a className={styles.sideBarLink} href={codeRepo} rel='noreferrer' target='_blank'>
                    Code Repository
                </a>
            )}

            {eventName && <p className={styles.badge}>{eventName}</p>}

            {!!props.challenge.terms.length && (
                <div className={styles.termsSection}>
                    <h3 className={styles.sideBarTitle}>Challenge Terms</h3>
                    <ul className={styles.termsList}>
                        {props.challenge.terms.map(term => <li key={term.id}>{term.id}</li>)}
                    </ul>
                </div>
            )}

            {props.isWipro && (
                <div className={styles.termsSection}>
                    <h3 className={styles.sideBarTitle}>Community Notice</h3>
                    <p className={styles.sideBarText}>
                        Wipro payment terms may apply for this challenge.
                    </p>
                </div>
            )}
        </aside>
    )
}

/**
 * Renders challenge specifications and sidebar metadata.
 *
 * @param props Challenge and community context data.
 * @returns Specification tab content.
 */
const Specification: FC<SpecificationProps> = (props: SpecificationProps) => {
    const isDesign = isDesignChallenge(props.challenge)
    const forumLink = getForumLink(props.challenge)

    const isWipro = useMemo(() => {
        if (props.communityMeta?.communityId === 'wipro') {
            return true
        }

        if (!props.communityMeta?.groupIds?.length) {
            return false
        }

        const challengeGroupIds = normalizeGroupIds(props.challenge.groups)

        return props.communityMeta.groupIds.some(groupId => challengeGroupIds.includes(groupId))
    }, [props.challenge.groups, props.communityMeta])

    const allowStockArt = getMetadataValue(props.challenge.metadata, 'allowStockArt') === 'true'

    return (
        <section className={styles.container}>
            <div className={styles.main}>
                {!isDesign && (
                    <>
                        <article className={styles.section}>
                            <h2>Challenge Overview</h2>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(props.challenge.description),
                                }}
                            />
                        </article>

                        {props.challenge.privateDescription && props.challenge.isRegistered && (
                            <article className={styles.section}>
                                <h2>Registered User Additional Information</h2>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(props.challenge.privateDescription),
                                    }}
                                />
                            </article>
                        )}
                    </>
                )}

                {isDesign && (
                    <>
                        <article className={styles.section}>
                            <h2>Challenge Summary</h2>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(props.challenge.description),
                                }}
                            />
                        </article>

                        {props.challenge.privateDescription && props.challenge.isRegistered && (
                            <article className={styles.section}>
                                <h2>Registered User Additional Information</h2>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(props.challenge.privateDescription),
                                    }}
                                />
                            </article>
                        )}

                        <article className={styles.section}>
                            <h2>Stock Photography</h2>
                            <p>
                                {allowStockArt
                                    ? 'Stock photography is allowed in this challenge.'
                                    : 'Stock photography is not allowed in this challenge.'}
                            </p>
                        </article>

                        <article className={styles.section}>
                            <h2>How To Submit</h2>
                            <ol>
                                <li>Prepare your final design files.</li>
                                <li>Create `Submission.zip` with the required deliverables.</li>
                                <li>Create `Source.zip` with all editable source files.</li>
                                <li>Include declarations for fonts and stock assets.</li>
                                <li>Upload before the submission deadline.</li>
                            </ol>
                        </article>

                        <article className={styles.section}>
                            <h2>Winner Selection</h2>
                            <p>
                                Winners are selected by the client at their sole discretion based on
                                challenge requirements and review outcomes.
                            </p>
                        </article>
                    </>
                )}

                {isWipro && (
                    <article className={styles.section}>
                        <h2>Payments</h2>
                        <p>
                            For Wipro employees, reward payouts and winner points are processed through
                            Wipro payroll/wallet rules after successful acceptance.
                        </p>
                    </article>
                )}
            </div>

            <SideBar
                challenge={props.challenge}
                forumLink={forumLink}
                isWipro={isWipro}
            />
        </section>
    )
}

export default Specification
