import { FC } from 'react'
import type { Components } from 'react-markdown'
import useSWR, { SWRResponse } from 'swr'

import { getRatingColor } from '~/libs/core'

import { MemberProfileSummary } from '../models'
import { getMemberProfileByHandle } from '../services'
import { memberProfileUrl } from '../utils'
import { rehypeForumMentions } from '../utils/forum-mention.utils'

import { ChallengeMarkdown } from './ChallengeMarkdown'

/**
 * Renders a profile link with the mentioned member's current maximum-rating color.
 * @param props authored handle; lookup requests are shared by SWR across repeated mentions.
 * @returns accessible profile link, including when profile enrichment is unavailable.
 * @throws Does not throw.
 */
export const ForumMention: FC<{ handle: string }> = props => {
    const { data: profile }: SWRResponse<MemberProfileSummary | undefined, Error> = useSWR(
        ['opportunities:forum-mention', props.handle.toLowerCase()],
        () => getMemberProfileByHandle(props.handle),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )
    const handle = profile?.handle ?? props.handle
    return (
        <a href={memberProfileUrl(handle)} style={{ color: getRatingColor(profile?.maxRating) }}>
            {`@${handle}`}
        </a>
    )
}

const FORUM_COMPONENTS: Components = {
    a: props => {
        const handle = props.node.properties?.['data-forum-mention']
        return typeof handle === 'string'
            ? <ForumMention handle={handle} />
            : <a href={props.href} title={props.title}>{props.children}</a>
    },
}

/**
 * Renders safe forum Markdown with rating-colored mentions in posts, excerpts, and previews.
 * @param props authored Markdown content.
 * @returns sanitized Markdown with mention links outside code and existing links.
 * @throws Does not throw.
 */
export const ForumMarkdown: FC<{ markdown: string }> = props => (
    <ChallengeMarkdown
        components={FORUM_COMPONENTS}
        markdown={props.markdown}
        rehypePlugins={[rehypeForumMentions]}
    />
)
