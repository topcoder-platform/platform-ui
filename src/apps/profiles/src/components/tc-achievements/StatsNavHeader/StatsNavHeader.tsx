import { FC } from 'react'
import { To } from 'react-router-dom'

import { IconOutline, LinkButton } from '~/libs/ui'

import styles from './StatsNavHeader.module.scss'

interface StatsNavHeaderProps {
    backLabel: string
    backAction: To
    closeAction: To
}

const StatsNavHeader: FC<StatsNavHeaderProps> = props => (
    <div className={styles.wrap}>
        <LinkButton
            icon={IconOutline.ChevronLeftIcon}
            iconToLeft
            label={`Back to ${props.backLabel}`}
            to={props.backAction}
            link
            variant='linkblue'
        />

        <LinkButton
            icon={IconOutline.XIcon}
            to={props.closeAction}
            size='lg'
            link
        />
    </div>
)

export default StatsNavHeader
