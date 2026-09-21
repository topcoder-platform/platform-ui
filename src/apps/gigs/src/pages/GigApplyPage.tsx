/* eslint-disable react/jsx-no-bind */
import { FC, useContext } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { authUrlLogin, authUrlSignup, profileContext, ProfileContextData } from '~/libs/core'
import { PageTitle } from '~/libs/ui'

import { Candidate, Gig } from '../models'
import { GigState } from '../components/GigShared'
import { getCandidate, getGig, RecruitError } from '../gigs.service'
import { GIGS_PATH, isOpenGig } from '../gigs.utils'
import GigApplicationForm from '../components/GigApplicationForm'

/** Loads the selected gig and signed-in candidate before mounting a form keyed to both member and job. */
const GigApplyPage: FC = () => {
    const { slug = '' }: { slug?: string } = useParams<{ slug: string }>()
    const { profile, initialized }: ProfileContextData = useContext(profileContext)
    const {
        data: job,
        error,
        mutate,
    }: SWRResponse<Gig> = useSWR(['gigs-detail', slug], (_key: string, id: string) => getGig(id), {
        shouldRetryOnError: false,
    })
    const {
        data: candidateResult,
        error: candidateError,
        mutate: retryCandidate,
    }: SWRResponse<{ candidate: Candidate | undefined }> = useSWR(
        profile?.email && job && isOpenGig(job)
            ? ['gigs-candidate', profile.userId, profile.email]
            : undefined,
        async (_key: string, _id: number, email: string) => ({ candidate: await getCandidate(email) }),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )
    const missing = error instanceof RecruitError && [400, 404].includes(error.status)
    return (
        <main className='gigs-container gigs-main'>
            <PageTitle>{`Apply${job?.name ? ` to ${job.name}` : ''} | Gigs | Topcoder`}</PageTitle>
            <Link className='gigs-back' to={`${GIGS_PATH}/${slug}`}>
                ← Gig details
            </Link>
            <header className='gigs-apply-header'>
                <p className='gigs-eyebrow'>Apply for Gig Work</p>
                <h1>{job?.name || 'Gig application'}</h1>
            </header>
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
            ) : !job || !initialized ? (
                <GigState title='Loading…' loading />
            ) : !isOpenGig(job) ? (
                <GigState title='This gig has been fulfilled' back />
            ) : !profile ? (
                <GigState title='You must be a Topcoder member to apply'>
                    <p>Sign in or create an account to apply for this opportunity.</p>
                    <div className='gigs-actions'>
                        <a className='gigs-button' href={authUrlLogin(window.location.href)}>
                            Sign in
                        </a>
                        <a href={authUrlSignup(window.location.href)}>Register</a>
                    </div>
                </GigState>
            ) : candidateError ? (
                <GigState
                    title='Unable to load your Gig Work profile'
                    retry={() => {
                        retryCandidate()
                    }}
                />
            ) : !candidateResult ? (
                <GigState title='Loading your Gig Work profile…' loading />
            ) : (
                <GigApplicationForm
                    key={`${profile.userId}:${slug}`}
                    job={job}
                    slug={slug}
                    profile={profile}
                    candidate={candidateResult.candidate}
                />
            )}
        </main>
    )
}

export default GigApplyPage
