/* eslint-disable react/jsx-no-bind */
import { FC, useContext } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { profileContext, ProfileContextData } from '~/libs/core'
import { PageTitle } from '~/libs/ui'

import { Gig } from '../models'
import { GigContent, GigFacts, GigState } from '../components/GigShared'
import { getGig, RecruitError } from '../gigs.service'
import { gigSkills, GIGS_PATH, isOpenGig } from '../gigs.utils'

/**
 * Shows job facts, required skills (or N/A when none are authored), description,
 * eligibility notes and the application handoff, including closed/error states.
 * External web resources open in an isolated tab; same-app and email links keep
 * their native navigation behavior.
 */
const GigDetailsPage: FC = () => {
    const { slug = '' }: { slug?: string } = useParams<{ slug: string }>()
    const { profile }: ProfileContextData = useContext(profileContext)
    const {
        data: job,
        error,
        mutate,
    }: SWRResponse<Gig> = useSWR(['gigs-detail', slug], (_key: string, id: string) => getGig(id), {
        shouldRetryOnError: false,
    })
    const missing = error instanceof RecruitError && [400, 404].includes(error.status)
    const skills = job ? gigSkills(job) : []
    return (
        <main className='gigs-container gigs-main'>
            <PageTitle>{`${job?.name || 'Gig details'} | Gigs | Topcoder`}</PageTitle>
            <Link className='gigs-back' to={GIGS_PATH}>
                ← All gigs
            </Link>
            {error ? (
                <GigState
                    title={missing ? 'Gig does not exist' : 'Unable to load this gig'}
                    retry={
                        missing
                            ? undefined
                            : () => {
                                mutate()
                            }
                    }
                    back
                />
            ) : !job ? (
                <GigState title='Loading gig…' loading />
            ) : !isOpenGig(job) ? (
                <GigState title='This gig has been fulfilled' back />
            ) : (
                <>
                    <header className='gigs-detail-header'>
                        <p className='gigs-eyebrow'>Gig Work</p>
                        <h1>{job.name}</h1>
                        <GigFacts job={job} detailed />
                    </header>
                    <div className='gigs-detail-layout'>
                        <article className='gigs-panel'>
                            <h2>Required skills</h2>
                            <div className='gigs-skills'>
                                {skills.length ? (
                                    skills.map(skill => (
                                        <span key={skill}>{skill}</span>
                                    ))
                                ) : (
                                    <span>N/A</span>
                                )}
                            </div>
                            <h2>Description</h2>
                            <GigContent
                                text={job.job_description_text || 'A description has not been provided.'}
                            />
                            <h2>Notes</h2>
                            <ul className='gigs-notes'>
                                <li>
                                    Topcoder does not provide visa sponsorship or work with staffing agencies.
                                </li>
                                <li>
                                    USA visa holders: consult an attorney before applying. Some visa statuses
                                    may not allow freelance work with Topcoder.
                                </li>
                                <li>
                                    Topcoder and Wipro employees are not eligible for Gig Work. Send questions
                                    to
                                    {' '}
                                    <a href='mailto:talent.taas@wipro.com'>talent.taas@wipro.com</a>
                                    .
                                </li>
                            </ul>
                            <div className='gigs-actions'>
                                <Link className='gigs-button' to={`${GIGS_PATH}/${slug}/apply`}>
                                    Apply to this job
                                </Link>
                                <Link to={GIGS_PATH}>View other gigs</Link>
                            </div>
                        </article>
                        <aside className='gigs-advice'>
                            <h2>Make your application stand out</h2>
                            <p>Help us match you with the right opportunity.</p>
                            <ol>
                                <li>
                                    <strong>Make sure your Topcoder profile says it all.</strong>
                                    <p>Keep your skills, location and experience up to date.</p>
                                    <a
                                        href={
                                            profile
                                                ? `${EnvironmentConfig.USER_PROFILE_URL}/${encodeURIComponent(
                                                    profile.handle,
                                                )}`
                                                : EnvironmentConfig.URLS.ACCOUNT_SETTINGS
                                        }
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        Update your profile
                                    </a>
                                </li>
                                <li>
                                    <strong>Let us know you’re here.</strong>
                                    <p>Introduce yourself and tell the Gig team what you’re looking for.</p>
                                    <a
                                        href={`https://vanilla.${EnvironmentConfig.TC_DOMAIN}`
                                            + '/categories/gig-work-discussions'}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                        Visit the Gig Work forum
                                    </a>
                                </li>
                                <li>
                                    <strong>Show your skills in a challenge.</strong>
                                    <p>
                                        Participate in Topcoder competitions to demonstrate what you can do.
                                    </p>
                                    <Link to='/opportunities'>Browse opportunities</Link>
                                </li>
                            </ol>
                            <p>
                                Need help?
                                {' '}
                                <a href='mailto:talent.taas@wipro.com'>Contact the Gig Work team</a>
                                .
                            </p>
                        </aside>
                    </div>
                </>
            )}
        </main>
    )
}

export default GigDetailsPage
