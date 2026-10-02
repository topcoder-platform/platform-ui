/**
 * Bordered card linking a university to its campus leaderboard.
 */
import { FC, useState } from 'react'
import { Link } from 'react-router-dom'

import { IconOutline } from '~/libs/ui'

import { CampusUniversity } from '../../config'

import styles from './UniversityCard.module.scss'

interface UniversityCardProps {
    readonly to: string
    readonly university: CampusUniversity
}

export const UniversityCard: FC<UniversityCardProps> = (props: UniversityCardProps) => {
    const [logoFailed, setLogoFailed] = useState<boolean>(false)
    const { logoUrl, name }: CampusUniversity = props.university

    return (
        <Link className={styles.universityCard} to={props.to}>
            <div className={styles.logo}>
                {logoUrl && !logoFailed ? (
                    <img
                        alt={name}
                        src={logoUrl}
                        onError={function onError() { setLogoFailed(true) }}
                    />
                ) : (
                    <span className={styles.logoFallback}>{name.charAt(0)}</span>
                )}
            </div>
            <div className={styles.name}>{name}</div>
            <span className={styles.cta}>
                View Leaderboard
                <IconOutline.ChevronRightIcon />
            </span>
        </Link>
    )
}

export default UniversityCard
