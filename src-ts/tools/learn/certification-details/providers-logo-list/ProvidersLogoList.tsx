import { FC, Fragment } from 'react'
import classNames from 'classnames'

import { TCACertification } from '../../learn-lib'

import { getProviderLogo } from './providers-logo-map'
import styles from './ProvidersLogoList.module.scss'

interface ProvidersLogoListProps {
    label: string
    className?: string
    providers: TCACertification['providers']
}

const ProvidersLogoList: FC<ProvidersLogoListProps> = (props: ProvidersLogoListProps) => (
    <div className={classNames('body-small-medium', props.className, styles.wrap)}>
        {props.label}
        <div>
            {props.providers.map(p => (
                <Fragment key={p}>{getProviderLogo(p)}</Fragment>
            ))}
        </div>
    </div>
)

export default ProvidersLogoList
