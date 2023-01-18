import { FC } from 'react'
import classNames from 'classnames'

import { FccLogoBlackSvg, TcLogoSvg } from '../../learn-lib'

import styles from './ProvidersLogoList.module.scss'

interface ProvidersLogoListProps {
    label: string
    className?: string
}

const ProvidersLogoList: FC<ProvidersLogoListProps> = (props: ProvidersLogoListProps) => (
    <div className={classNames('body-small-medium', props.className, styles.wrap)}>
        {props.label}
        <div>
            <FccLogoBlackSvg />
            <TcLogoSvg />
        </div>
    </div>
)

export default ProvidersLogoList
