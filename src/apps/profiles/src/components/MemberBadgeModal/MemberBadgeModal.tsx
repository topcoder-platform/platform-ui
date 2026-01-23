import { FC } from 'react'
import { format } from 'date-fns'
import ReactMarkdown, { type Options as ReactMarkdownOptions } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'

import { UserBadge } from '~/libs/core'
import { BaseModal } from '~/libs/ui'

import styles from './MemberBadgeModal.module.scss'

interface MemberBadgeModalProps {
    isBadgeDetailsOpen: boolean
    onClose: () => void
    selectedBadge: UserBadge
}

const Markdown = ReactMarkdown as unknown as FC<ReactMarkdownOptions>

const MemberBadgeModal: FC<MemberBadgeModalProps> = (props: MemberBadgeModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open={props.isBadgeDetailsOpen}
        size='lg'
        title='COMMUNITY AWARDS & HONORS'
    >
        <div className={styles.badgeModalWrap}>
            <img
                src={props.selectedBadge.org_badge.badge_image_url}
                alt={`Topcoder community badge - ${props.selectedBadge.org_badge.badge_name}`}
                className={styles.badgeImageModal}
            />
            <div className={styles.badgeInfoWrap}>
                <div className={styles.badgeTitleModal}>{props.selectedBadge.org_badge.badge_name}</div>
                <div className={styles.badgeAwardedAt}>
                    AWARDED ON
                    {' '}
                    {format(new Date(props.selectedBadge.awarded_at), 'PPP')}
                </div>
                <Markdown
                    remarkPlugins={[
                        remarkFrontmatter,
                        [remarkGfm, { singleTilde: false }],
                        remarkBreaks,
                    ]}
                    className={styles.badgeDescription}
                >
                    {props.selectedBadge.org_badge.badge_description}
                </Markdown>
            </div>
        </div>
    </BaseModal>
)

export default MemberBadgeModal
