import { FC, ReactNode, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { renderRichTextToHtml } from '~/libs/shared'
import {
    IconOutline,
    Tooltip,
} from '~/libs/ui'

import {
    ChallengeInfo,
    CommunityMeta,
    fetchTermsForChallenge,
    getForumLink,
    isDesignChallenge,
    isMarathonMatch,
    TermInfo,
} from '../../../../lib'

import styles from './Specification.module.scss'

const DESIGN_CHALLENGE_SUBMISSION_URL
    = 'https://www.topcoder.com/thrive/articles/Formatting%20Your%20Submission%20for%20Design%20Challenges'
const DESIGN_CHALLENGE_TYPES_URL = 'https://www.topcoder.com/thrive/articles/Design%20Challenge%20Types'
const EXTENSION_VSCODE_URL
    = 'https://marketplace.visualstudio.com/items?itemName=Topcoder.topcoder-workflow&ssr=false#overview'
const FONT_POLICY_URL
    = 'https://help.topcoder.com/hc/en-us/articles/217959447-Font-Policy-for-Design-Challenges'
const HOW_TO_COMPETE_IN_MARATHON_URL
    = 'https://www.topcoder.com/thrive/articles/How%20To%20Compete%20in%20a%20Marathon%20Match'
const PASS_SCREENING_URL
    = 'https://help.topcoder.com/hc/en-us/articles/217959577-How-to-Pass-Screening-in-Design-Challenges'
const STOCK_ART_POLICY_URL
    = 'http://help.topcoder.com/hc/en-us/articles/217481408-Policy-for-Stock-Artwork-in-Design-Submissions'
const TEMPLATES_REPO_URL = 'https://github.com/topcoder-platform-templates'
const TOPCODER_CHALLENGES_EXPLAINED_URL
    = 'https://www.topcoder.com/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities'
const TOPGEAR_TERMS_URL = 'https://topgear.topcoder.com/challenges/terms/detail/f1d8cca9-ac24-473c-998d-02f499a829cb'
const USABLE_CODE_DEV_URL = 'https://www.topcoder.com/thrive/articles/Usable%20Code%20in%20Dev%20Challenges'

interface ChallengeWithReviewType extends ChallengeInfo {
    reviewType?: string
}

interface DesignSubmissionSectionProps {
    challenge: ChallengeInfo
    forumLink?: string
}

interface EligibleEventSectionProps {
    eventDetail?: {
        description?: string
        eventName?: string
    }
}

interface InfoTooltipProps {
    content: ReactNode
}

interface RichTextProps {
    html: string
}

interface ChallengeTermLink {
    id: string
    title?: string
}

interface SideBarProps {
    challenge: ChallengeInfo
    challengeTerms: ChallengeTermLink[]
    forumLink?: string
    isDesign: boolean
    isDevelop: boolean
    isLoggedIn: boolean
    isLoadingTerms: boolean
    isMM: boolean
    isWipro: boolean
    terms: TermInfo[]
}

interface SidebarLinkProps {
    children: ReactNode
    href: string
    openNewTab?: boolean
    title?: string
    tooltip?: ReactNode
}

interface SidebarSectionProps {
    children: ReactNode
    title: string
}

interface SpecificationProps {
    challenge: ChallengeInfo
    communityMeta?: CommunityMeta
    isLoggedIn: boolean
}

interface TermsSectionProps {
    isLoggedIn: boolean
    isLoading: boolean
    termDetails: TermInfo[]
    terms: ChallengeTermLink[]
}

interface ChallengeTermRecord {
    id?: string
    name?: unknown
    title?: unknown
}

interface TermTitleSource {
    id: string
    title?: string
}

interface ReviewStyleSectionProps {
    reviewType: string
}

interface ChallengeLinksSectionProps {
    challenge: ChallengeInfo
    isDesign: boolean
    isDevelop: boolean
    isMM: boolean
    isWipro: boolean
}

/**
 * Converts scalar metadata values into strings for conditional rendering.
 *
 * @param value Metadata value from challenge-api-v6.
 * @returns String representation, or an empty string for unsupported values.
 */
function stringifyMetadataValue(value: unknown): string {
    if (value === undefined) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return `${value}`
    }

    return ''
}

/**
 * Reads a metadata value from either the legacy array shape or the object shape.
 *
 * @param metadata Challenge metadata payload.
 * @param key Metadata key to read.
 * @returns Metadata value as a string.
 */
function getMetadataValue(metadata: unknown, key: string): string {
    if (Array.isArray(metadata)) {
        const item = metadata.find(entry => (
            typeof entry === 'object'
            && Boolean(entry)
            && (entry as { name?: string }).name === key
        )) as { value?: unknown } | undefined

        return stringifyMetadataValue(item?.value)
    }

    if (typeof metadata === 'object' && Boolean(metadata)) {
        return stringifyMetadataValue((metadata as Record<string, unknown>)[key])
    }

    return ''
}

/**
 * Determines whether a metadata flag should be treated as enabled.
 *
 * @param value Metadata flag value.
 * @returns True for common enabled flag values.
 */
function isMetadataEnabled(value: string): boolean {
    return ['1', 'true', 'yes'].includes(
        value.trim()
            .toLowerCase(),
    )
}

/**
 * Extracts a scorecard id from the matching challenge phase.
 *
 * @param challenge Challenge details.
 * @param phaseName Phase name to inspect.
 * @returns Scorecard id, or an empty string when missing.
 */
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

/**
 * Checks whether a scorecard id points to a legacy Online Review scorecard.
 *
 * @param scorecardId Scorecard id from phase constraints.
 * @returns True when the id is a positive numeric value.
 */
function hasScorecard(scorecardId: string): boolean {
    const parsedScorecardId = Number(scorecardId)

    return Number.isFinite(parsedScorecardId) && parsedScorecardId > 0
}

/**
 * Normalizes mixed challenge group payloads into group ids.
 *
 * @param groups Challenge groups from the API.
 * @returns Group id list.
 */
function normalizeGroupIds(groups: Array<Record<string, unknown> | string>): string[] {
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

/**
 * Extracts term link data from the challenge term payload.
 *
 * @param terms Challenge terms from the API.
 * @returns Unique term links with any available display title.
 */
function getChallengeTermLinks(terms: ChallengeInfo['terms']): ChallengeTermLink[] {
    const seenTermIds = new Set<string>()

    return terms.reduce<ChallengeTermLink[]>((result, term) => {
        const termRecord = term as ChallengeTermRecord | string
        const termId = typeof termRecord === 'string' ? termRecord : termRecord.id

        if (!termId || seenTermIds.has(termId)) {
            return result
        }

        seenTermIds.add(termId)
        result.push({
            id: termId,
            title: typeof termRecord === 'string'
                ? undefined
                : readTermTitle(termRecord),
        })

        return result
    }, [])
}

/**
 * Reads a human-friendly term title from a challenge term record.
 *
 * @param term Challenge term record.
 * @returns Term title when present.
 */
function readTermTitle(term: ChallengeTermRecord): string | undefined {
    if (typeof term.title === 'string' && term.title.trim()) {
        return term.title
    }

    if (typeof term.name === 'string' && term.name.trim()) {
        return term.name
    }

    return undefined
}

/**
 * Gets the best available term display name without exposing raw term ids.
 *
 * @param term Challenge term source.
 * @param termDetails Loaded term details.
 * @param index Term position in the sidebar.
 * @returns Display label for the term link.
 */
function getTermDisplayName(
    term: ChallengeTermLink,
    termDetails: Map<string, TermTitleSource>,
    index: number,
): string {
    const loadedTerm = termDetails.get(term.id)
    const loadedTitle = loadedTerm?.title?.trim()
    const challengeTitle = term.title?.trim()

    return loadedTitle
        || challengeTitle
        || `Challenge term ${index + 1}`
}

/**
 * Safely parses the design source file type metadata.
 *
 * @param value JSON-encoded file type metadata.
 * @returns Source file type labels.
 */
function parseFileTypes(value: string): string[] {
    if (!value) {
        return []
    }

    try {
        const parsedValue = JSON.parse(value) as unknown

        if (!Array.isArray(parsedValue)) {
            return []
        }

        return parsedValue.filter((item): item is string => (
            typeof item === 'string' && Boolean(item.trim())
        ))
    } catch {
        return []
    }
}

/**
 * Formats the legacy design submission limit metadata.
 *
 * @param value Submission limit metadata value.
 * @returns Human-readable submission limit.
 */
function getSubmissionLimitDisplay(value: string): string {
    const submissionLimit = Number(value)

    if (!Number.isFinite(submissionLimit) || submissionLimit <= 0) {
        return 'Unlimited'
    }

    if (submissionLimit === 1) {
        return '1 submission'
    }

    return `${submissionLimit} submissions`
}

/**
 * Resolves the review type used by the legacy sidebar copy.
 *
 * @param challenge Challenge details.
 * @returns Review type key.
 */
function getReviewType(challenge: ChallengeInfo): string {
    const challengeReviewType = (challenge as ChallengeWithReviewType).reviewType
    const legacyReviewType = (challenge.legacy as { reviewType?: string }).reviewType

    return challengeReviewType ?? legacyReviewType ?? 'COMMUNITY'
}

/**
 * Renders sanitized challenge rich text.
 *
 * @param props Sanitized HTML content.
 * @returns Rendered rich text block.
 */
const RichText: FC<RichTextProps> = (props: RichTextProps) => (
    <div
        className={styles.richText}
        dangerouslySetInnerHTML={{ __html: props.html }}
    />
)

/**
 * Renders the legacy information icon tooltip.
 *
 * @param props Tooltip content.
 * @returns Information icon with hover tooltip.
 */
const InfoTooltip: FC<InfoTooltipProps> = (props: InfoTooltipProps) => (
    <Tooltip
        className={styles.tooltipOverlay}
        content={<div className={styles.tooltipContent}>{props.content}</div>}
        disableWrap
    >
        <span className={styles.infoIcon}>
            <IconOutline.InformationCircleIcon />
        </span>
    </Tooltip>
)

/**
 * Renders a grouped sidebar section.
 *
 * @param props Section title and content.
 * @returns Sidebar section.
 */
const SidebarSection: FC<SidebarSectionProps> = (props: SidebarSectionProps) => (
    <div className={styles.sideBarSection}>
        <h2 className={styles.sideBarTitle}>{props.title}</h2>
        {props.children}
    </div>
)

/**
 * Renders a link row with optional tooltip.
 *
 * @param props Link details.
 * @returns Sidebar link row.
 */
const SidebarLink: FC<SidebarLinkProps> = (props: SidebarLinkProps) => (
    <p className={styles.linkParagraph}>
        <a
            href={props.href}
            rel={props.openNewTab ? 'noreferrer' : undefined}
            target={props.openNewTab ? '_blank' : undefined}
            title={props.title}
        >
            {props.children}
        </a>
        {props.tooltip && <InfoTooltip content={props.tooltip} />}
    </p>
)

/**
 * Renders eligible event information from the challenge payload.
 *
 * @param props Event details from the challenge.
 * @returns Eligible event sidebar section.
 */
const EligibleEventSection: FC<EligibleEventSectionProps> = (props: EligibleEventSectionProps) => {
    if (!props.eventDetail?.eventName) {
        return <></>
    }

    return (
        <div className={styles.sideBarSection}>
            <h3 className={styles.sideBarSubTitle}>ELIGIBLE EVENTS:</h3>
            <SidebarLink href={`//${props.eventDetail.eventName}.topcoder.com`} openNewTab>
                {props.eventDetail.description ?? props.eventDetail.eventName}
            </SidebarLink>
        </div>
    )
}

/**
 * Renders the legacy review style sidebar section.
 *
 * @param props Review type data.
 * @returns Review style section.
 */
const ReviewStyleSection: FC<ReviewStyleSectionProps> = (props: ReviewStyleSectionProps) => {
    const isPeerReview = props.reviewType === 'PEER'
    const reviewTypeTitle = isPeerReview ? 'Peer Review' : 'Community Review Board'
    const reviewTypeDescription = isPeerReview
        ? 'Your peers perform a thorough review based on scorecards.'
        : 'Community Review Board performs a thorough review based on scorecards.'

    return (
        <SidebarSection title='Review style'>
            <h3 className={styles.sideBarSubTitle}>Final Review</h3>
            <p className={styles.valueWithTooltip}>
                {reviewTypeTitle}
                <InfoTooltip
                    content={(
                        <>
                            <h4>Final Review:</h4>
                            <p>{reviewTypeDescription}</p>
                        </>
                    )}
                />
            </p>

            <h3 className={styles.sideBarSubTitle}>Approval</h3>
            <p className={styles.valueWithTooltip}>
                User Sign-Off
                <InfoTooltip
                    content={(
                        <>
                            <h4>Approval:</h4>
                            <p>Customer has final opportunity to sign-off on the delivered assets.</p>
                        </>
                    )}
                />
            </p>
        </SidebarSection>
    )
}

/**
 * Renders legacy non-Marathon challenge links.
 *
 * @param props Challenge link inputs.
 * @returns Challenge links sidebar section.
 */
const ChallengeLinksSection: FC<ChallengeLinksSectionProps> = (props: ChallengeLinksSectionProps) => {
    if (props.isMM) {
        return (
            <SidebarSection title='Challenge links'>
                <SidebarLink
                    href={HOW_TO_COMPETE_IN_MARATHON_URL}
                    openNewTab
                    title='How To Compete in a Marathon Match'
                >
                    How To Compete in a Marathon Match
                </SidebarLink>
            </SidebarSection>
        )
    }

    const environment = getMetadataValue(props.challenge.metadata, 'environment')
    const codeRepo = getMetadataValue(props.challenge.metadata, 'codeRepo')
    const reviewScorecardId = getScorecardId(props.challenge, 'Review')
    const screeningScorecardId = getScorecardId(props.challenge, 'Screening')
    const scorecardBaseUrl = `${EnvironmentConfig.ADMIN.ONLINE_REVIEW_URL}/actions/ViewScorecard?scid=`

    return (
        <SidebarSection title='Challenge links'>
            {props.isDevelop && environment && (
                <SidebarLink href={environment}>Environment</SidebarLink>
            )}
            {props.isDevelop && codeRepo && (
                <SidebarLink href={codeRepo}>Code Repository</SidebarLink>
            )}
            {hasScorecard(screeningScorecardId) && (
                <SidebarLink href={`${scorecardBaseUrl}${screeningScorecardId}`}>
                    Screening Scorecard
                </SidebarLink>
            )}
            {hasScorecard(reviewScorecardId) && !props.isDesign && (
                <SidebarLink
                    href={`${scorecardBaseUrl}${reviewScorecardId}`}
                    tooltip={(
                        <>
                            <h4>See how you&apos;ll be reviewed.</h4>
                            <p>
                                Make sure you review the scorecard before you start.
                                This will show you how your submission will be judged and scored.
                            </p>
                        </>
                    )}
                >
                    Review Scorecard
                </SidebarLink>
            )}
            {!props.isWipro && !props.isDesign && (
                <SidebarLink
                    href={USABLE_CODE_DEV_URL}
                    openNewTab
                    title='Useable Code Rules'
                    tooltip={(
                        <>
                            <h4>Useable Code Rules</h4>
                            <p>A set of guidelines to help determine if code is acceptable or not.</p>
                        </>
                    )}
                >
                    Useable Code Rules
                </SidebarLink>
            )}
        </SidebarSection>
    )
}

/**
 * Renders the legacy design-specific sidebar blocks.
 *
 * @param props Challenge and forum data.
 * @returns Design sidebar sections.
 */
const DesignSubmissionSection: FC<DesignSubmissionSectionProps> = (props: DesignSubmissionSectionProps) => {
    const discussionLinks = props.challenge.discussions.filter(discussion => (
        discussion.type?.toLowerCase() === 'challenge' && Boolean(discussion.url)
    ))
    const fileTypes = parseFileTypes(getMetadataValue(props.challenge.metadata, 'fileTypes'))
    const submissionLimit = getMetadataValue(props.challenge.metadata, 'submissionLimit')
    const submissionLimitDisplay = getSubmissionLimitDisplay(submissionLimit)

    return (
        <>
            <SidebarSection title='Submission format'>
                <h3 className={styles.sideBarSubTitle}>Your Design Files:</h3>
                <ol className={styles.sidebarOrderedList}>
                    <li>Look for instructions in this challenge regarding what files to provide.</li>
                    <li>Place your submission files into a &quot;Submission.zip&quot; file.</li>
                    <li>Place all of your source files into a &quot;Source.zip&quot; file.</li>
                    <li>Declare your fonts, stock photos, and icons in a &quot;Declaration.txt&quot; file.</li>
                    <li>Create a JPG preview file.</li>
                    <li>Place the 4 files you just created into a single zip file. This will be what you upload.</li>
                </ol>
                <p className={styles.linkParagraph}>
                    Trouble formatting your submission or want to learn more?
                    {' '}
                    <a href={DESIGN_CHALLENGE_SUBMISSION_URL}>Read the FAQ.</a>
                </p>

                <h3 className={styles.sideBarSubTitle}>Fonts, Stock Photos, and Icons:</h3>
                <p className={styles.sideBarText}>
                    All fonts, stock photos, and icons within your design must be declared when you submit.
                    DO NOT include any 3rd party files in your submission or source files. Read about the
                    {' '}
                    <a href={FONT_POLICY_URL}>policy.</a>
                </p>

                <h3 className={styles.sideBarSubTitle}>Screening:</h3>
                <p className={styles.sideBarText}>
                    All submissions are screened for eligibility before the challenge holder picks winners.
                    Don&apos;t let your hard work go to waste. Learn more about how to
                    {' '}
                    <a href={PASS_SCREENING_URL}>pass screening.</a>
                </p>
            </SidebarSection>

            <SidebarSection title='Challenge links'>
                {(props.forumLink || discussionLinks.length > 0) && (
                    <p className={styles.linkParagraph}>
                        Questions?
                        {' '}
                        {!discussionLinks.length && props.forumLink && (
                            <a href={props.forumLink} rel='noopener noreferrer' target='_blank'>
                                Ask in the Challenge Discussion Forums.
                            </a>
                        )}
                    </p>
                )}
                {discussionLinks.map(discussion => (
                    <SidebarLink
                        href={discussion.url ?? ''}
                        key={discussion.id ?? discussion.url}
                        openNewTab
                    >
                        CHALLENGE DISCUSSION
                    </SidebarLink>
                ))}
            </SidebarSection>

            <SidebarSection title='Source files'>
                {!!fileTypes.length && (
                    <ul className={styles.sourceFilesList}>
                        {fileTypes.map(fileType => <li key={fileType}>{fileType}</li>)}
                    </ul>
                )}
                <p className={styles.sideBarText}>You must include all source files with your submission.</p>
            </SidebarSection>

            <SidebarSection title='Submission limit'>
                <p className={styles.linkParagraph}>
                    {submissionLimit ? submissionLimitDisplay : <strong>{submissionLimitDisplay}</strong>}
                </p>
            </SidebarSection>
        </>
    )
}

/**
 * Renders challenge term links when the member is logged in.
 *
 * @param props Term ids and loaded term details.
 * @returns Challenge terms sidebar section.
 */
const TermsSection: FC<TermsSectionProps> = (props: TermsSectionProps) => {
    if (!props.isLoggedIn || !props.terms.length) {
        return <></>
    }

    const termsById: Map<string, TermTitleSource> = new Map(props.termDetails.map(term => [term.id, term]))
    const hasDisplayableTermNames = props.termDetails.length > 0
        || props.terms.some(term => Boolean(term.title))
    const showLoadingOnly = props.isLoading && !hasDisplayableTermNames

    return (
        <SidebarSection title='Challenge terms'>
            {showLoadingOnly && (
                <p className={styles.sideBarText}>Loading terms...</p>
            )}
            {!showLoadingOnly && (
                <div className={styles.termList}>
                    {props.terms.map((term, index) => (
                        <div className={styles.term} key={term.id}>
                            <a href={`${EnvironmentConfig.TOPCODER_URL}/challenges/terms/detail/${term.id}`}>
                                {getTermDisplayName(term, termsById, index)}
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </SidebarSection>
    )
}

/**
 * Renders the legacy toolbox links.
 *
 * @returns Toolbox sidebar section.
 */
const ToolboxSection: FC = () => (
    <SidebarSection title='Toolbox'>
        <SidebarLink
            href={EXTENSION_VSCODE_URL}
            openNewTab
            title='Topcoder Extension for VSCode'
            tooltip={(
                <>
                    <h4>Topcoder Extension for VSCode</h4>
                    <p>
                        Shortcuts to perform actions related to Topcoder platform without having to open a browser.
                    </p>
                </>
            )}
        >
            Topcoder Extension for VSCode
        </SidebarLink>
        <SidebarLink href={TEMPLATES_REPO_URL} openNewTab title='Topcoder Templates repository'>
            Topcoder Templates repository
        </SidebarLink>
    </SidebarSection>
)

/**
 * Renders the legacy challenge detail sidebar.
 *
 * @param props Challenge metadata and loaded terms.
 * @returns Challenge detail sidebar.
 */
const SideBar: FC<SideBarProps> = (props: SideBarProps) => {
    const topCrowdFlag = getMetadataValue(props.challenge.metadata, 'is_platform')

    if (isMetadataEnabled(topCrowdFlag)) {
        return <></>
    }

    const eventDetail = props.challenge.events?.[0] as EligibleEventSectionProps['eventDetail']

    return (
        <aside className={styles.sideBar}>
            <div className={styles.sideBarInner}>
                <SidebarSection title='Learn'>
                    <SidebarLink href={props.isWipro ? TOPGEAR_TERMS_URL : TOPCODER_CHALLENGES_EXPLAINED_URL}>
                        {props.isWipro ? 'TopGear Challenges Explained' : 'Topcoder Challenges Explained'}
                    </SidebarLink>
                </SidebarSection>

                <EligibleEventSection eventDetail={eventDetail} />

                {!props.isDesign && !props.isMM && (
                    <ReviewStyleSection reviewType={getReviewType(props.challenge)} />
                )}

                {!props.isDesign && (
                    <ChallengeLinksSection
                        challenge={props.challenge}
                        isDesign={props.isDesign}
                        isDevelop={props.isDevelop}
                        isMM={props.isMM}
                        isWipro={props.isWipro}
                    />
                )}

                {props.isDesign && (
                    <DesignSubmissionSection
                        challenge={props.challenge}
                        forumLink={props.forumLink}
                    />
                )}

                <TermsSection
                    isLoggedIn={props.isLoggedIn}
                    isLoading={props.isLoadingTerms}
                    termDetails={props.terms}
                    terms={props.challengeTerms}
                />

                {!props.isWipro && <ToolboxSection />}

                {!!props.challenge.legacyId && (
                    <div className={styles.legacyChallengeId}>
                        <h3>
                            ID:
                            {' '}
                            {props.challenge.legacyId}
                        </h3>
                    </div>
                )}
            </div>
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
    const isDevelop = props.challenge.track.name.toLowerCase() === 'development'
    const isMM = isMarathonMatch(props.challenge)
    const forumLink = getForumLink(props.challenge)
    const challengeTerms = useMemo(
        () => getChallengeTermLinks(props.challenge.terms),
        [props.challenge.terms],
    )
    const challengeTermIds = useMemo(
        () => challengeTerms.map(term => term.id),
        [challengeTerms],
    )
    const {
        data: sidebarTerms = [],
        isValidating: isLoadingSidebarTerms,
    }: SWRResponse<TermInfo[], Error> = useSWR<TermInfo[], Error>(
        props.isLoggedIn && challengeTermIds.length
            ? ['community/challenge-terms', ...challengeTermIds]
            : undefined,
        () => fetchTermsForChallenge(challengeTermIds),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )
    const descriptionHtml = useMemo(
        () => renderRichTextToHtml(props.challenge.description),
        [props.challenge.description],
    )
    const privateDescriptionHtml = useMemo(
        () => renderRichTextToHtml(props.challenge.privateDescription ?? ''),
        [props.challenge.privateDescription],
    )

    const isWipro = useMemo(() => {
        if (props.communityMeta?.communityId === 'wipro') {
            return true
        }

        if (!props.communityMeta?.groupIds?.length) {
            return false
        }

        const challengeGroupIds = normalizeGroupIds(props.challenge.groups as Array<Record<string, unknown> | string>)

        return props.communityMeta.groupIds.some(groupId => challengeGroupIds.includes(groupId))
    }, [props.challenge.groups, props.communityMeta])

    const allowStockArt = isMetadataEnabled(getMetadataValue(props.challenge.metadata, 'allowStockArt'))

    return (
        <section className={styles.container}>
            <div className={styles.main}>
                {!isDesign && (
                    <>
                        {descriptionHtml && (
                            <article className={styles.section}>
                                <h2>Challenge Overview</h2>
                                <RichText html={descriptionHtml} />
                            </article>
                        )}

                        {privateDescriptionHtml && props.challenge.isRegistered && (
                            <article className={styles.section}>
                                <h2>Registered User Additional Information</h2>
                                <RichText html={privateDescriptionHtml} />
                            </article>
                        )}
                    </>
                )}

                {isDesign && (
                    <>
                        {descriptionHtml && (
                            <article className={styles.section}>
                                <h2>Challenge Summary</h2>
                                <RichText html={descriptionHtml} />
                                <p className={styles.note}>
                                    Please read the challenge specification carefully and watch the forums for any
                                    questions or feedback concerning this challenge. It is important that you monitor
                                    any updates provided by the client or Studio Admins in the forums. Please post any
                                    questions you might have for the client in the forums.
                                </p>
                            </article>
                        )}

                        {privateDescriptionHtml && props.challenge.isRegistered && (
                            <article className={styles.section}>
                                <h2>Registered User Additional Information</h2>
                                <RichText html={privateDescriptionHtml} />
                            </article>
                        )}

                        <article className={styles.section}>
                            <h2>Stock Photography</h2>
                            <p>
                                {allowStockArt
                                    ? 'Stock photography is allowed in this challenge.'
                                    : (
                                        'Stock photography is not allowed in this challenge. '
                                        + 'All submitted elements must be designed solely by you.'
                                    )}
                                {' '}
                                <a href={STOCK_ART_POLICY_URL}>See this page for more details.</a>
                            </p>
                        </article>

                        <article className={styles.section}>
                            <h2>How To Submit</h2>
                            <ul>
                                <li>
                                    New to Studio?
                                    {' '}
                                    <a href={DESIGN_CHALLENGE_TYPES_URL}>Learn how to compete here</a>
                                </li>
                                <li>
                                    Upload your submission in three parts (
                                    <a href={DESIGN_CHALLENGE_SUBMISSION_URL}>Learn more here</a>
                                    ). Your design should be finalized and should contain only a single design concept.
                                </li>
                                <li>
                                    If your submission wins, your source files must be correct and final fixes
                                    (if applicable) must be completed before payment can be released.
                                </li>
                                <li>
                                    You may submit as many times as you&apos;d like during the submission phase, but
                                    only
                                    the number of files listed above in the Submission Limit that you rank the highest
                                    will be considered.
                                </li>
                            </ul>
                        </article>

                        <article className={styles.section}>
                            <h2>Winner Selection</h2>
                            <p>
                                Submissions are viewable to the client as they are entered into the challenge.
                                Winners are selected by the client and are chosen solely at the client&apos;s
                                discretion.
                            </p>
                        </article>
                    </>
                )}

                {isWipro && (
                    <article className={styles.section}>
                        <h2>Payments</h2>
                        <p>
                            For employees of Wipro Technologies, reward payouts and winner points are processed
                            through Wipro payroll/wallet rules after successful acceptance.
                        </p>
                    </article>
                )}
            </div>

            <SideBar
                challenge={props.challenge}
                challengeTerms={challengeTerms}
                forumLink={forumLink}
                isDesign={isDesign}
                isDevelop={isDevelop}
                isLoggedIn={props.isLoggedIn}
                isLoadingTerms={isLoadingSidebarTerms}
                isMM={isMM}
                isWipro={isWipro}
                terms={sidebarTerms}
            />
        </section>
    )
}

export default Specification
