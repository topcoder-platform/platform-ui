import { FC } from 'react'
import {
    Navigate,
    useLocation,
    useParams,
} from 'react-router-dom'

interface LegacyOpportunityRedirectPageProps {
    list?: boolean
    review?: boolean
}

/**
 * Preserves query parameters and hash fragments on a replacement route.
 *
 * @param pathname canonical Opportunities pathname.
 * @param search legacy route query string.
 * @param hash legacy route fragment.
 * @returns complete internal redirect target.
 * @throws Does not throw.
 */
export function buildLegacyOpportunityRedirect(
    pathname: string,
    search: string,
    hash: string,
): string {
    return `${pathname}${search}${hash}`
}

/**
 * Redirects replaced community-app challenge and review-opportunity URLs to
 * their canonical Opportunities equivalents.
 *
 * Review URLs resolve `opportunityId` from the query string and fall back to
 * the challenge detail when it is absent. List/detail redirects preserve the
 * remaining query string and hash for compatible filters and deep links.
 *
 * @param props legacy list or review route type; omitted means challenge detail.
 * @returns a replace-navigation to the canonical Opportunities route.
 * @throws Does not throw for missing route/query parameters.
 */
export const LegacyOpportunityRedirectPage: FC<LegacyOpportunityRedirectPageProps> = props => {
    const location = useLocation()
    const { challengeId }: Readonly<{ challengeId?: string }> = useParams<{ challengeId?: string }>()
    const query = new URLSearchParams(location.search)
    const opportunityId = query.get('opportunityId')
        ?.trim()

    if (props.review && opportunityId) {
        query.delete('opportunityId')
        const remainingQuery = query.toString()
        return (
            <Navigate
                replace
                to={buildLegacyOpportunityRedirect(
                    `/opportunities/review/${encodeURIComponent(opportunityId)}`,
                    remainingQuery ? `?${remainingQuery}` : '',
                    location.hash,
                )}
            />
        )
    }

    const pathname = props.list || !challengeId
        ? '/opportunities/competitions'
        : `/opportunities/challenge/${encodeURIComponent(challengeId)}`
    return (
        <Navigate
            replace
            to={buildLegacyOpportunityRedirect(pathname, location.search, location.hash)}
        />
    )
}

export default LegacyOpportunityRedirectPage
