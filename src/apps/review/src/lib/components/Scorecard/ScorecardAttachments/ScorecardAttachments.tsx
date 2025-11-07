import { FC } from 'react'

// import styles from './ScorecardAttachments.module.scss'

interface ScorecardAttachmentsProps {
    className?: string
}

const ScorecardAttachments: FC<ScorecardAttachmentsProps> = props => (
    <div className={props.className}>
        attachments
    </div>
)

export default ScorecardAttachments
