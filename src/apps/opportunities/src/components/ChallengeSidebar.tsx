/* eslint-disable react/jsx-no-bind */
import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline, Tooltip } from '~/libs/ui'

import {
    ChallengeAiReviewConfig,
    ChallengeOpportunity,
    ChallengeTerm,
} from '../models'
import {
    challengeFileTypes,
    challengeForumUrl,
    ChallengeSidebarLink,
    challengeSidebarLinks,
    challengeSubmissionLimit,
} from '../utils'
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

import styles from './ChallengeSidebar.module.scss'

interface ChallengeSidebarProps {
    aiReviewConfig?: ChallengeAiReviewConfig
    challenge: ChallengeOpportunity
    onContactTeam: () => void
    onShowTerms: (term?: ChallengeTerm) => void
    reviewStyleLoading?: boolean
    reviewStyleUnavailable?: boolean
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

interface ReviewStylePresentation {
    label: string
    tooltip: string
}

const MANUAL_REVIEW_STYLE: ReviewStylePresentation = {
    label: 'Manual',
    tooltip: 'Community Review Board performs a thorough review based on scorecards.',
}

const AI_REVIEW_STYLES: Record<ChallengeAiReviewConfig['mode'], ReviewStylePresentation> = {
    AI_GATING: {
        label: 'AI Gating',
        tooltip: 'AI performs a preliminary review, then the Community Review Board evaluates submissions that pass.',
    },
    AI_ONLY: {
        label: 'AI only',
        tooltip: 'AI will perform a thorough review based on scorecards.',
    },
}

/**
 * Renders one Figma review-style bullet and its accessible explanation.
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
 * Renders the API-backed Review Style rows shared by every challenge type.
 *
 * @param props AI review configuration and request state.
 * @returns Review Style heading with manual or AI-specific detail rows.
 * @throws Does not throw.
 */
const ReviewStyleSection: FC<ReviewStyleSectionProps> = props => {
    const presentation = props.config
        ? AI_REVIEW_STYLES[props.config.mode] ?? MANUAL_REVIEW_STYLE
        : MANUAL_REVIEW_STYLE

    return (
        <div className={styles.infoSection}>
            <h3>
                <IconOutline.DocumentSearchIcon />
                Review Style
            </h3>
            {props.loading
                ? <p className={styles.reviewStyleStatus}>Loading review style…</p>
                : props.unavailable
                    ? <p className={styles.reviewStyleStatus}>Review style is unavailable.</p>
                    : (
                        <ul className={styles.reviewStyleList}>
                            <ReviewStyleItem {...presentation} />
                            {props.config && (
                                <ReviewStyleItem
                                    label={`Instant Review is ${props.config.instantReview ? 'On' : 'Off'}`}
                                    tooltip={props.config.instantReview
                                        ? 'You will receive AI feedback during the submission phase'
                                        : 'You will not receive AI feedback during the submission phase.'}
                                />
                            )}
                        </ul>
                    )}
        </div>
    )
}

/**
 * Returns a challenge catalog label from current or legacy API shapes.
 *
 * @param value string or expanded catalog record.
 * @returns normalized catalog label.
 * @throws Does not throw.
 */
function catalogName(value: string | { name?: string } | undefined): string {
    return typeof value === 'string' ? value : value?.name ?? ''
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
    const designChallenge = catalogName(props.challenge.track)
        .toLowerCase() === 'design'
    const developmentChallenge = catalogName(props.challenge.track)
        .toLowerCase() === 'development'
    const submissionGuidance = designChallenge || developmentChallenge
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

    return (
        <aside className={styles.sidebar}>
            <section className={styles.promo}>
                <img alt='' aria-hidden='true' className={styles.promoArt} src={programBanner} />
                <div>
                    <h3>Join the AI Exponential league</h3>
                    <p>Where elite AI builders compete to solve real-world challenges and grow fast.</p>
                    <Link to='/thrive'>
                        Explore the program
                        <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                    </Link>
                </div>
            </section>
            <SidebarCard icon={<img alt='' aria-hidden='true' src={sidebarReviewIcon} />} title='Review App'>
                <p>The place to track your screening and review scores.</p>
                <Link to={`/review/active-challenges/${props.challenge.id}/challenge-details`}>
                    View Review App
                    <img alt='' aria-hidden='true' src={sidebarArrowIcon} />
                </Link>
            </SidebarCard>
            <SidebarCard icon={<img alt='' aria-hidden='true' src={sidebarBookIcon} />} title='Educational Materials'>
                <p>Read educational material in Topcoder Thrive.</p>
                <Link to='/thrive/search'>Topcoder Challenge Explained</Link>
                {submissionGuidance && (
                    <>
                        <Link to='/thrive/tracks'>How to Compete in Design Challenges</Link>
                        <Link to='/thrive/search'>How to Approach the Checkpoint Feed</Link>
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
                                    <strong>Submission.zip:</strong>
                                    {' '}
                                    Place your submission files into a zip file.
                                </li>
                                <li>
                                    <strong>Source.zip:</strong>
                                    {' '}
                                    Place all of your source files into a zip file.
                                </li>
                                <li>
                                    <strong>Declaration.txt:</strong>
                                    {' '}
                                    Declare your fonts, stock photos, and icons.
                                </li>
                                <li>
                                    <strong>Preview.jpg:</strong>
                                    {' '}
                                    Create the requested preview image file.
                                </li>
                            </ol>
                        </div>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarFrameIcon} />
                                Fonts, Stock Photos, and Icons
                            </h3>
                            <p>All third-party assets within your design must be declared when you submit.</p>
                        </div>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarSearchIcon} />
                                Screening
                            </h3>
                            <p>
                                All submissions are screened for eligibility before the challenge holder picks winners.
                            </p>
                        </div>
                    </>
                )}
                <ReviewStyleSection
                    config={props.aiReviewConfig}
                    loading={props.reviewStyleLoading}
                    unavailable={props.reviewStyleUnavailable}
                />
                <div className={styles.infoSection}>
                    <h3>
                        <img alt='' aria-hidden='true' src={sidebarPolicyIcon} />
                        Challenge Terms
                    </h3>
                    {(props.challenge.terms ?? []).length > 0
                        ? props.challenge.terms?.map((term, index) => (
                            <ChallengeTermButton
                                index={index}
                                key={term.id ?? term.title ?? `term-${index}`}
                                onShowTerms={props.onShowTerms}
                                term={term}
                            />
                        ))
                        : <button onClick={showAllTerms} type='button'>Review challenge terms</button>}
                </div>
                {challengeLinks.length > 0 && (
                    <div className={styles.infoSection}>
                        <h3>
                            <IconOutline.LinkIcon />
                            Challenge Links
                        </h3>
                        {challengeLinks.map(externalLink)}
                    </div>
                )}
                {submissionGuidance && (
                    <>
                        <div className={styles.infoSection}>
                            <h3>
                                <img alt='' aria-hidden='true' src={sidebarInventoryIcon} />
                                Source files
                            </h3>
                            {fileTypes.length > 0
                                ? <ul>{fileTypes.map(fileType => <li key={fileType}>{fileType}</li>)}</ul>
                                : <p>You must include all source files requested in the Requirements content.</p>}
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
