import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import classNames from 'classnames'

import {
    getRatingColor,
    useMemberStats,
    UserProfile,
    UserStats,
    UserStatsDistributionResponse,
    UserTrait,
    useStatsDistribution,
} from '~/libs/core'
import { Tooltip } from '~/libs/ui'

import { EditMemberPropertyBtn } from '../../../components'
import { getPreferredRolesText } from '../../../lib'

import {
    calculateTopPercentileFromDistribution,
    formatTopPercentile,
    getCompactRatingColor,
    getPreferredRolesDisplay,
    getProfileRating,
    getRatingAudienceLabel,
    getRatingDistributionQuery,
    parsePreferredRolesText,
} from './MemberRatingCard.utils'
import { MemberRatingInfoModal } from './MemberRatingInfoModal'
import { ModifyPreferredRolesModal } from './ModifyPreferredRolesModal'
import styles from './MemberRatingCard.module.scss'

interface MemberRatingCardProps {
    authProfile: UserProfile | undefined
    memberPersonalizationTraitsData: UserTrait[] | undefined
    mutatePersonalizationTraits: () => void
    profile: UserProfile
}

const MemberRatingCard: FC<MemberRatingCardProps> = (props: MemberRatingCardProps) => {
    const memberStats: UserStats | undefined = useMemberStats(props.profile.handle)
    const rating: number | undefined = useMemo(() => getProfileRating(memberStats), [memberStats])
    const compactRatingColor: string = getCompactRatingColor(rating, getRatingColor(rating))

    const [isInfoModalOpen, setIsInfoModalOpen]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const [isPreferredRolesModalOpen, setIsPreferredRolesModalOpen]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState(false)

    const [arePreferredRolesExpanded, setArePreferredRolesExpanded]: [
        boolean,
        Dispatch<SetStateAction<boolean>>
    ] = useState(false)

    const ratingDistributionQuery = useMemo(() => getRatingDistributionQuery(memberStats), [memberStats])

    const ratingDistribution: UserStatsDistributionResponse | undefined = useStatsDistribution(ratingDistributionQuery)

    const maxPercentile: number | undefined = useMemo(() => (
        calculateTopPercentileFromDistribution(ratingDistribution?.distribution, rating)
    ), [rating, ratingDistribution])
    const audienceLabel: string = getRatingAudienceLabel(memberStats)
    const hasPositiveRating: boolean = Number(rating) > 0
    const percentileLabel: string | undefined = hasPositiveRating && maxPercentile
        ? `Top ${formatTopPercentile(maxPercentile)}%`
        : undefined
    const visiblePercentile: number | undefined = hasPositiveRating ? maxPercentile : undefined
    const canEditPreferredRoles: boolean = props.authProfile?.handle === props.profile.handle
    const preferredRolesText: string = useMemo(
        () => getPreferredRolesText(props.memberPersonalizationTraitsData),
        [props.memberPersonalizationTraitsData],
    )
    const preferredRoles: string[] = useMemo(
        () => parsePreferredRolesText(preferredRolesText),
        [preferredRolesText],
    )
    const preferredRolesDisplay = useMemo(
        () => getPreferredRolesDisplay(preferredRoles, arePreferredRolesExpanded),
        [arePreferredRolesExpanded, preferredRoles],
    )
    const hasRating: boolean = rating !== undefined
    const shouldRenderPreferredRoles: boolean = preferredRoles.length > 0 || canEditPreferredRoles
    const shouldRenderCard: boolean = hasRating || shouldRenderPreferredRoles

    function handleInfoModalClose(): void {
        setIsInfoModalOpen(false)
    }

    function handleInfoModalOpen(): void {
        setIsInfoModalOpen(true)
    }

    function handlePreferredRolesModalClose(): void {
        setIsPreferredRolesModalOpen(false)
    }

    function handlePreferredRolesModalOpen(): void {
        setIsPreferredRolesModalOpen(true)
    }

    function handlePreferredRolesModalSave(): void {
        setIsPreferredRolesModalOpen(false)
        props.mutatePersonalizationTraits()
    }

    function handlePreferredRolesToggle(): void {
        setArePreferredRolesExpanded(!arePreferredRolesExpanded)
    }

    function renderPreferredRoles(): JSX.Element {
        if (preferredRoles.length === 0 && !canEditPreferredRoles) {
            return <></>
        }

        return (
            <div className={styles.preferredRolesWrap}>
                {preferredRoles.length > 0 && (
                    <div className={styles.preferredRolesList}>
                        {preferredRolesDisplay.visibleRoles.map((role: string) => (
                            <span className={styles.preferredRole} key={role}>
                                {role}
                            </span>
                        ))}

                        {preferredRolesDisplay.toggleLabel && (
                            <button
                                className={styles.preferredRolesToggle}
                                onClick={handlePreferredRolesToggle}
                                type='button'
                            >
                                {preferredRolesDisplay.toggleLabel}
                            </button>
                        )}
                    </div>
                )}

                {canEditPreferredRoles && (
                    <EditMemberPropertyBtn
                        className={styles.preferredRolesEditButton}
                        onClick={handlePreferredRolesModalOpen}
                    />
                )}
            </div>
        )
    }

    return shouldRenderCard ? (
        <div className={styles.container}>
            {hasRating && (
                <div className={styles.innerWrap}>
                    <button type='button' className={styles.valueWrap} onClick={handleInfoModalOpen}>
                        <p className={styles.value} style={{ color: compactRatingColor }}>
                            {rating}
                        </p>
                        <p className={styles.name}>Rating</p>
                    </button>
                    {
                        percentileLabel ? (
                            <Tooltip
                                className={styles.ratingTooltip}
                                content={(
                                    <span className={styles.tooltipContent}>
                                        {percentileLabel}
                                        {' '}
                                        of
                                        <br />
                                        2M
                                        {' '}
                                        {audienceLabel.toLowerCase()}
                                    </span>
                                )}
                                disableTooltip={isInfoModalOpen}
                                place='top'
                            >
                                <button
                                    type='button'
                                    className={classNames(styles.valueWrap, styles.percentileWrap)}
                                    onClick={handleInfoModalOpen}
                                >
                                    <p
                                        className={classNames(styles.value, styles.percentileValue)}
                                    >
                                        {percentileLabel}
                                    </p>
                                    <p className={styles.name}>{audienceLabel}</p>
                                </button>
                            </Tooltip>
                        ) : undefined
                    }
                    <button type='button' className={styles.link} onClick={handleInfoModalOpen}>What is this?</button>
                </div>
            )}

            {
                isInfoModalOpen && hasRating && (
                    <MemberRatingInfoModal
                        onClose={handleInfoModalClose}
                        percentile={visiblePercentile}
                        profile={props.profile}
                        rating={rating}
                        audienceLabel={audienceLabel}
                        ratingDistribution={ratingDistribution}
                    />
                )
            }

            {renderPreferredRoles()}

            {
                isPreferredRolesModalOpen && (
                    <ModifyPreferredRolesModal
                        memberPersonalizationTraitsData={props.memberPersonalizationTraitsData}
                        onClose={handlePreferredRolesModalClose}
                        onSave={handlePreferredRolesModalSave}
                        profile={props.profile}
                    />
                )
            }
        </div>
    ) : <></>
}

export default MemberRatingCard
