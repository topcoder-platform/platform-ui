import { FC } from 'react'
import { Link } from 'react-router-dom'

import { Gig } from '../models'
import { gigCompensation, gigDuration, gigField, gigSkills, GIGS_PATH } from '../gigs.utils'
import { ReactComponent as CalendarIcon } from '../assets/icon-black-calendar.svg'
import { ReactComponent as LocationIcon } from '../assets/icon-black-location.svg'
import { ReactComponent as PaymentIcon } from '../assets/icon-black-payment.svg'
import dollarsTag from '../assets/tag-dolars.png'
import hotTag from '../assets/tag-hot.png'
import newTag from '../assets/tag-new.png'
import skillsIcon from '../assets/icon-skills.png'
import styles from '../pages/GigsPage.module.scss'

const tags: Record<string, string> = { $$$: dollarsTag, Hot: hotTag, New: newTag }

/** Restores the community listing's compact facts row without changing shared detail cards. */
export const GigListingCard: FC<{ job: Gig }> = props => {
    const skills = gigSkills(props.job)
    const tag = gigField(props.job, 'Job Tag', '')
    const href = `${GIGS_PATH}/${props.job.slug}`
    return (
        <article className={styles.card}>
            {tags[tag] && <img className={styles.tag} src={tags[tag]} alt={tag} />}
            <h2><Link to={href}>{props.job.name}</Link></h2>
            <div className={styles.facts}>
                <span title={skills.join(', ')}>
                    <img src={skillsIcon} alt='' />
                    <span className={styles.srOnly}>Skills: </span>
                    {skills.length ? `${skills.slice(0, 2)
                        .join(', ')}${skills.length > 2 ? ',…' : ''}` : 'n/a'}
                </span>
                <span>
                    <LocationIcon aria-hidden />
                    <span className={styles.srOnly}>Location: </span>
                    {props.job.country || 'Anywhere'}
                </span>
                <span>
                    <PaymentIcon aria-hidden />
                    <span className={styles.srOnly}>Compensation: </span>
                    {gigCompensation(props.job)}
                </span>
                <span>
                    <CalendarIcon aria-hidden />
                    <span className={styles.srOnly}>Duration: </span>
                    {gigDuration(props.job)}
                </span>
                <Link className={styles.details} to={href} aria-label={`View details for ${props.job.name}`}>
                    View details
                </Link>
            </div>
        </article>
    )
}

/** Displays the four legacy gradient tiles with location, title, and compensation. */
export const GigHotlist: FC<{ jobs: Gig[] }> = props => (
    <section className={styles.hotlist} aria-label='Hotlist gigs'>
        {props.jobs.map(job => (
            <Link key={job.slug} to={`${GIGS_PATH}/${job.slug}`}>
                <span>
                    <LocationIcon aria-hidden />
                    {job.country || 'Anywhere'}
                </span>
                <h2>{job.name}</h2>
                <span>{gigCompensation(job)}</span>
            </Link>
        ))}
    </section>
)
