/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable ordered-imports/ordered-imports */
import { EnvironmentConfig } from '~/config'
import Member from '@talentSearch/lib/models/Member'
import moment from 'moment'

import styles from './MemberHandleRenderer.module.scss'

const MemberHandleRenderer: (member:Member) => JSX.Element
= (member:Member): JSX.Element => {
    function handleOpenLink(): void {
        window.open(`${EnvironmentConfig.URLS.USER_PROFILE}/${member.handle}`, '_blank')
    }

    const scoreText: string = `Skill score: ${member.skillScore}`

    return (
        <section className={styles.memberCell}>
            <div className={styles.memberImage}>
                <a onClick={handleOpenLink}><img alt='Avatar' src={member.photoURL} className={styles.avatar} /></a>
            </div>
            <div className={styles.memberHandle}>
                <a onClick={handleOpenLink}>{member.handle}</a>
            </div>
            <div className={styles.countryRow}>
                <span className={styles.memberCountry}>{member.country}</span>
                <span className={styles.separator}> | </span>
                <span className={styles.memberWins}>{scoreText}</span>
            </div>
            <div className={styles.memberAccountAge}>
                Member since&nbsp;
                {moment(member.createdAt)
                    .format('MMM YYYY')}
            </div>
        </section>
    )
}

export default MemberHandleRenderer
