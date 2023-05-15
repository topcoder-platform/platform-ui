import { FC } from "react"
import ReactMarkdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import { UserBadge } from "~/libs/core"
import { BaseModal } from "~/libs/ui"
import { format } from 'date-fns'

import styles from "./MemberBadgeModal.module.scss"

interface MemberBadgeModalProps {
    isBadgeDetailsOpen: boolean
    onClose: () => void
    selectedBadge: UserBadge
}

const MemberBadgeModal: FC<MemberBadgeModalProps> = (props: MemberBadgeModalProps) => {
    const { isBadgeDetailsOpen, onClose, selectedBadge } = props

    return (
        <BaseModal
            onClose={onClose}
            open={isBadgeDetailsOpen}
            size='lg'
            title="COMMUNITY AWARDS & HONORS"
        >
            <div className={styles.badgeModalWrap}>
                <img src={selectedBadge.org_badge.badge_image_url} alt={`Topcoder community badge - ${selectedBadge.org_badge.badge_name}`} className={styles.badgeImageModal} />
                <div className={styles.badgeInfoWrap}>
                    <div className={styles.badgeTitleModal}>{selectedBadge.org_badge.badge_name}</div>
                    <div className={styles.badgeAwardedAt}>AWARDED ON  {format(new Date(selectedBadge.awarded_at), 'PPP')}</div>
                    <ReactMarkdown
                        remarkPlugins={[
                            remarkFrontmatter,
                            [remarkGfm, { singleTilde: false }],
                            remarkBreaks,
                        ]}
                        className={styles.badgeDescription}
                    >
                        {selectedBadge.org_badge.badge_description}
                    </ReactMarkdown>
                </div>
            </div>
        </BaseModal>
    )
}

export default MemberBadgeModal
