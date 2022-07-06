import classNames from 'classnames'

import styles from './WorkBadgeRenderer.module.scss'

interface WorkBadgeRendererProps {
    count?: number
    hideZero?: boolean
    type: 'messages' | 'items'
}

function WorkBadgeRenderer(props: WorkBadgeRendererProps): JSX.Element {

    if (props.count === undefined || (!!props.hideZero && props.count === 0)) {
        return <></>
    }

    const badgeColor: 'unread-messages' | 'no-unread-messages' | 'items' = props.type === 'items'
        ? 'items'
        : (props.count === 0
            ? 'no-unread-messages'
            : 'unread-messages')

    return (
        <div className={classNames(styles.badge, styles[badgeColor])}>
            {props.count}
        </div>
    )
}

export default WorkBadgeRenderer
