/* eslint-disable react/jsx-no-bind */
import { FC, ReactNode, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { IconOutline, Tooltip } from '~/libs/ui'

import {
    ChallengeAiReviewConfig,
    ChallengeOpportunity,
    ChallengeTerm,
} from '../models'
import { getChallengeTermsDetails } from '../services'
import {
    getInstantReviewStyleItem,
    getReviewStyleModeItem,
    hasAiReviewConfig,
} from '../utils/ai-review-config.utils'
import {
    challengeAllowsStockArt,
    challengeFileTypes,
    challengeForumUrl,
    challengeReviewAppUrl,
    ChallengeSidebarLink,
    challengeSidebarLinks,
    challengeSubmissionLimit,
    isMarathonMatchChallenge,
} from '../utils'
import {
    AI_EXPONENTIAL_LEAGUE_URL,
    AI_REVIEWERS_HELP_URL,
    CHALLENGE_EXPLAINED_URL,
    CHECKPOINT_FEEDBACK_LEARNING_URL,
    DESIGN_CHALLENGE_LEARNING_URL,
    DESIGN_SCREENING_LEARNING_URL,
    DESIGN_SUBMISSION_FORMAT_URL,
    MARATHON_MATCH_LEARNING_URL,
    MARATHON_MATCH_TOURNAMENT_URL,
    QA_BUG_HUNT_LEARNING_URL,
    QA_COMPETITION_TYPES_URL,
    USABLE_CODE_RULES_URL,
} from '../utils/opportunity-learning.utils'
import programBanner from '../assets/ai-exponential-program.png'
import sidebarArrowIcon from '../assets/sidebar-arrow.svg'
import sidebarBookIcon from '../assets/sidebar-book.svg'
import sidebarFolderIcon from '../assets/sidebar-folder.svg'
import sidebarFrameIcon from '../assets/sidebar-frame.svg'
import sidebarHelpIcon from '../assets/sidebar-help.svg'
import sidebarInventoryIcon from '../assets/sidebar-inventory.svg'
import sidebarLimitIcon from '../assets/sidebar-limit.svg'
import sidebarPolicyIcon from '../assets/sidebar-policy.svg'
import sidebarReviewIcon from '../assets/sidebar-review.svg'
import sidebarSearchIcon from '../assets/sidebar-search.svg'

import { challengeCatalogKey } from './challenge-card.utils'
import styles from './ChallengeSidebar.module.scss'

const FILE_SUBMISSION_POLICY_URL
    = 'https://help.topcoder.com/hc/en-us/articles/217959447-Font-Policy-for-Design-Challenges'

interface ChallengeSidebarProps {
    aiReviewConfig?: ChallengeAiReviewConfig
    challenge: ChallengeOpportunity
    onContactTeam: () => void
    onShowTerms: (term?: ChallengeTerm) => void
    reviewStyleLoading?: boolean
    reviewStyleUnavailable?: boolean
    showReviewStyle?: boolean
}

interface SidebarCardProps {
    children: ReactNode
    icon: ReactNode
    title: string
}

interface ReviewStyleItemProps {
    label: string
    tooltip: string
}

interface ReviewStyleSectionProps {
    config?: ChallengeAiReviewConfig
    loading?: boolean
    unavailable?: boolean
}

/**
 * Renders one review-style bullet with an accessible tooltip.
 *
 * @param props member-facing label and tooltip copy.
 * @returns one review-style list item.
 * @throws Does not throw.
 */
const ReviewStyleItem: FC<ReviewStyleItemProps> = props => (
    <li>
        <span className={styles.reviewStyleRow}>
            <span>{props.label}</span>
            <Tooltip
                className={styles.reviewStyleTooltip}
                content={props.tooltip}
                place='top'
                triggerOn='click-hover'
            >
                <button
                    aria-label={`About ${props.label}`}
                    className={styles.reviewStyleInfoButton}
                    type='button'
                >
                    <IconOutline.InformationCircleIcon aria-hidden='true' />
                </button>
            </Tooltip>
        </span>
    </li>
)

/**
 * Renders development-challenge review style above challenge terms.
 *
 * @param props AI review configuration and request state.
 * @returns Review mode and instant review details.
 * @throws Does not throw.
 */
const ReviewStyleSection: FC<ReviewStyleSectionProps> = props => {
    const reviewModeItem = getReviewStyleModeItem(props.config)

    return (
        <div className={styles.infoSection}>
            <h3>
                <img alt='' aria-hidden='true' src={sidebarReviewIcon} />
                Review Style
            </h3>
            {props.loading
                ? <p className={styles.reviewConfigStatus}>Loading review configuration…</p>
                : props.unavailable
                    ? <p className={styles.reviewConfigStatus}>Review configuration is unavailable.</p>
                    : (
                        <ul className={styles.reviewStyleList}>
                            <ReviewStyleItem {...reviewModeItem} />
                            {hasAiReviewConfig(props.config) && (
                                <ReviewStyleItem
                                    {...getInstantReviewStyleItem(props.config?.instantReview === true)}
                                />
                            )}
                        </ul>
                    )}
        </div>
    )
}

/**
 * Renders one reusable challenge right-rail card.
 *
 * @param props card icon, title, and body content.
 * @returns a styled sidebar section.
 * @throws Does not throw.
 */
const SidebarCard: FC<SidebarCardProps> = props => (
    <section className={styles.card}>
        <h3>
            {props.icon}
            {props.title}
        </h3>
        {props.children}
    </section>
)

interface ChallengeTermButtonProps {
    index: number
    onShowTerms: (term: ChallengeTerm) => void
    term: ChallengeTerm
}

/**
 * Opens the exact authored term selected in the challenge information rail.
 *
 * @param props term, source position, and modal callback.
 * @returns one term link-style button.
 * @throws Does not throw.
 */
const ChallengeTermButton: FC<ChallengeTermButtonProps> = props => {
    /**
     * Opens the term represented by this sidebar row.
     *
     * @returns void after forwarding the authored term to the parent modal handler.
     * @throws Does not throw.
     */
    const showTerm = (): void => props.onShowTerms(props.term)
    return (
        <button onClick={showTerm} type='button'>
            {props.term.title || `Challenge term ${props.index + 1}`}
        </button>
    )
}

/**
 * Renders the challenge-details support column, including Review App, learning,
 * submission guidance, challenge terms, source files, and team contact.
 *
 * @param props challenge context and modal actions.
 * @returns Figma right rail cards.
 * @throws Does not throw.
 */
export const ChallengeSidebar: FC<ChallengeSidebarProps> = props => {
    const fileTypes = challengeFileTypes(props.challenge)
    const submissionLimit = challengeSubmissionLimit(props.challenge)
    const links = challengeSidebarLinks(props.challenge)
    const forumUrl = challengeForumUrl(props.challenge)
    const trackKey = challengeCatalogKey(props.challenge.track)
    const designChallenge = trackKey === 'design'
    const marathonMatch = isMarathonMatchChallenge(props.challenge)
    const developmentChallenge = trackKey === 'development'
    const qualityAssuranceChallenge = ['qa', 'qualityassurance'].includes(trackKey)
    const termsRequestKey = props.challenge.terms?.some(term => !!term.id && !term.title)
        ? ['opportunities:challenge-sidebar-terms', props.challenge.id]
        : undefined
    const termsResponse: SWRResponse<ChallengeTerm[], Error> = useSWR(
        termsRequestKey,
        () => getChallengeTermsDetails(props.challenge.terms ?? []),
        { revalidateOnFocus: false },
    )
    const displayedTerms = useMemo(() => {
        const hydratedTerms = termsResponse.data
        if (!hydratedTerms || hydratedTerms.length !== (props.challenge.terms ?? []).length) {
            return props.challenge.terms ?? []
        }

        return hydratedTerms
    }, [props.challenge.terms, termsResponse.data])
    /**
     * Opens the all-terms fallback used when the challenge has no individual term rows.
     *
     * @returns void after requesting the parent modal without a selected term.
     * @throws Does not throw.
     */
    const showAllTerms = (): void => props.onShowTerms()
    const challengeLinks = [...links.challengeLinks]
    if (forumUrl && !challengeLinks.some(link => link.url === forumUrl)) {
        challengeLinks.push({ label: 'Challenge Forum', url: forumUrl })
    }

    /**
     * Renders one safe external right-rail link.
     *
     * @param link approved label and HTTP(S) URL.
     * @returns external anchor with a visual indicator.
     * @throws Does not throw.
     */
    const externalLink = (link: ChallengeSidebarLink): ReactNode => (
        <a href={link.url} key={`${link.label}-${link.url}`} rel='noreferrer' target='_blank'>
            {link.label}
            <IconOutline.ExternalLinkIcon />
        </a>
    )
    const reviewAppDescription = designChallenge
        ? 'The place to track your screening and review scores.'
        : 'The place to see your scores and feedback, and improve before the final review.'

    return (
        <aside className={styles.sidebar}>
            <section className={styles.promo}>
                <img alt='' aria-hidden='true' className={styles.promoArt} src={programBanner} />
                <div>
                    <h3>{marathonMatch ? 'Marathon Match Tournament' : 'Join the AI Exponential league'}</h3>
                    <p>
                        {marathonMatch
                            ? 'Join the battle of competitors in a series of challenging Marathon Matches.'
                            : 'Where elite AI builders compete to solve real-world challenges and grow fast.'}
                    </p>
                    {marathonMatch
                        ? (
                            <a
                                className={styles.promoLink}
                                href={MARATHON_MATCH_TOURNAMENT_URL}
                                rel='noreferrer'
                                target='_blank'
                            >
                                Explore the program
                                <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                            </a>
                        )
                        : (
                            <a className={styles.promoLink} href={AI_EXPONENTIAL_LEAGUE_URL}>
                                Explore the program
                                <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                            </a>
                        )}
                </div>
            </section>
            <SidebarCard icon={<img alt='' aria-hidden='true' src={sidebarReviewIcon} />} title='Review App'>
                <p>{reviewAppDescription}</p>
                <a
                    href={challengeReviewAppUrl(props.challenge.id)}
                    rel='noreferrer'
                    target='_blank'
                >
                    View Review App
                    <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                </a>
            </SidebarCard>
            <SidebarCard icon={<img alt='' aria-hidden='true' src={sidebarBookIcon} />} title='Educational Materials'>
                <p>Read educational material on Topcoder Thrive.</p>
                <a
                    className={styles.learningLink}
                    href={CHALLENGE_EXPLAINED_URL}
                    rel='noreferrer'
                    target='_blank'
                >
                    Topcoder Challenges Explained
                    <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                </a>
                {marathonMatch && (
                    <a
                        className={styles.learningLink}
                        href={MARATHON_MATCH_LEARNING_URL}
                        rel='noreferrer'
                        target='_blank'
                    >
                        How to Compete in a Marathon Match
                        <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                    </a>
                )}
                {developmentChallenge && !marathonMatch && (
                    <>
                        <a
                            className={styles.learningLink}
                            href={AI_REVIEWERS_HELP_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            AI Reviewers - Member Help Guide
                            <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                        </a>
                        <a
                            className={styles.learningLink}
                            href={USABLE_CODE_RULES_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            Usable Code Rules
                            <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                        </a>
                    </>
                )}
                {qualityAssuranceChallenge && (
                    <>
                        <a
                            className={styles.learningLink}
                            href={QA_BUG_HUNT_LEARNING_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            How to Compete in a Bug Hunt Challenge
                            <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                        </a>
                        <a
                            className={styles.learningLink}
                            href={QA_COMPETITION_TYPES_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            QA Competition Types
                            <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                        </a>
                    </>
                )}
                {designChallenge && (
                    <>
                        <a
                            className={styles.learningLink}
                            href={DESIGN_CHALLENGE_LEARNING_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            How to Compete in Design Challenges
                            <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                        </a>
                        <a
                            className={styles.learningLink}
                            href={CHECKPOINT_FEEDBACK_LEARNING_URL}
                            rel='noreferrer'
                            target='_blank'
                        >
                            How to Approach the Checkpoint
                            {' '}
                            <span className={styles.learningLinkEnd}>
                                Feedback
                                <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                            </span>
                        </a>
                    </>
                )}
            </SidebarCard>
            <section className={`${styles.card} ${styles.challengeInfo}`}>
                {designChallenge && (
                    <>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarFolderIcon} />
                                Submission Format
                            </h3>
                            <ol>
                                <li>Look for instructions in this challenge regarding what files to provide.</li>
                                <li>
                                    <strong className={styles.fileNameLabel}>Submission.zip:</strong>
                                    {' '}
                                    Place your submission files into a zip file.
                                </li>
                                <li>
                                    <strong className={styles.fileNameLabel}>Source.zip:</strong>
                                    {' '}
                                    Place all of your source files into a zip file.
                                </li>
                                <li>
                                    <strong className={styles.fileNameLabel}>Declaration.txt:</strong>
                                    {' '}
                                    Declare your fonts, stock photos, and icons in a txt file.
                                </li>
                                <li>
                                    <strong className={styles.fileNameLabel}>Preview.jpg:</strong>
                                    {' '}
                                    Create a 1024 x 1024 px preview image file.
                                </li>
                                <li>
                                    Place the 4 files you just created into a single zip file.
                                    This will be what you upload.
                                </li>
                            </ol>
                            <p>
                                Trouble formatting your submission or want to learn more?
                                {' '}
                                <a
                                    className={styles.inlineAnchor}
                                    href={DESIGN_SUBMISSION_FORMAT_URL}
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    Read the FAQ.
                                    <IconOutline.ExternalLinkIcon aria-hidden='true' />
                                </a>
                            </p>
                        </div>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarFrameIcon} />
                                Fonts, Stock Photos, and Icons
                            </h3>
                            <p>
                                All fonts, stock photos, and icons within your design must be declared when you
                                submit. DO NOT include any 3rd party files in your submission or source files.
                                {' '}
                                Read about
                                {' '}
                                the
                                {' '}
                                <a
                                    className={styles.inlineAnchor}
                                    href={FILE_SUBMISSION_POLICY_URL}
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    Policy
                                    <IconOutline.ExternalLinkIcon aria-hidden='true' />
                                </a>
                                .
                            </p>
                            {challengeAllowsStockArt(props.challenge) && (
                                <p>Stock photography is allowed in this challenge.</p>
                            )}
                        </div>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarSearchIcon} />
                                Screening
                            </h3>
                            <p>
                                All submissions are screened for eligibility before the challenge
                                holder picks winners.
                                {' '}
                                Don&apos;t let your hard work go to waste. Learn more about
                                {' '}
                                <a
                                    className={styles.inlineAnchor}
                                    href={DESIGN_SCREENING_LEARNING_URL}
                                    rel='noreferrer'
                                    target='_blank'
                                >
                                    how to pass screening
                                    <IconOutline.ExternalLinkIcon aria-hidden='true' />
                                </a>
                                .
                            </p>
                        </div>
                    </>
                )}
                {developmentChallenge && !marathonMatch && props.showReviewStyle && (
                    <ReviewStyleSection
                        config={props.aiReviewConfig}
                        loading={props.reviewStyleLoading}
                        unavailable={props.reviewStyleUnavailable}
                    />
                )}
                <div className={styles.infoSection}>
                    <h3>
                        <img alt='' aria-hidden='true' src={sidebarPolicyIcon} />
                        Challenge Terms
                    </h3>
                    {displayedTerms.length > 0
                        ? displayedTerms.map((term, index) => (
                            <ChallengeTermButton
                                index={index}
                                key={term.id ?? term.title ?? `term-${index}`}
                                onShowTerms={props.onShowTerms}
                                term={term}
                            />
                        ))
                        : <button onClick={showAllTerms} type='button'>Review challenge terms</button>}
                </div>
                {!developmentChallenge && challengeLinks.length > 0 && (
                    <div className={styles.infoSection}>
                        <h3>
                            <IconOutline.LinkIcon />
                            Challenge Links
                        </h3>
                        {challengeLinks.map(externalLink)}
                    </div>
                )}
                {designChallenge && (
                    <>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarInventoryIcon} />
                                Source files
                            </h3>
                            {fileTypes.length > 0 && (
                                <ul>{fileTypes.map(fileType => <li key={fileType}>{fileType}</li>)}</ul>
                            )}
                            <p>You must include all source files with your submission.</p>
                            {links.attachments.length > 0 && (
                                <div className={styles.resourceLinks}>{links.attachments.map(externalLink)}</div>
                            )}
                        </div>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarLimitIcon} />
                                Submission limit
                            </h3>
                            <p>
                                {submissionLimit
                                    ? `${submissionLimit} ${submissionLimit === 1 ? 'submission' : 'submissions'}`
                                    : 'Unlimited'}
                            </p>
                        </div>
                    </>
                )}
            </section>
            <SidebarCard icon={<img alt='' aria-hidden='true' src={sidebarHelpIcon} />} title='Need help?'>
                <p>If you are facing technical difficulties with this challenge, contact the team to get assistance.</p>
                <button onClick={props.onContactTeam} type='button'>
                    Contact the team
                    <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                </button>
            </SidebarCard>
        </aside>
    )
}
