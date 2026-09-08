/* eslint-disable react/jsx-no-bind */
import { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import useSWR, { SWRResponse } from 'swr'

import { BaseModal, Button, IconOutline, LoadingSpinner } from '~/libs/ui'

import { gigCompensation, gigDuration, gigField, gigFlag, gigSkills, GIGS_PATH } from '../gigs.utils'
import { Gig } from '../models'
import { getGigPolicy } from '../gigs.service'

/** Shows a loading, failure, or empty state with an optional retry and navigation destination. */
export const GigState: FC<{
    title: string
    children?: ReactNode
    loading?: boolean
    retry?: () => void
    back?: boolean
}> = props => (
    <section className='gigs-state' role={props.retry ? 'alert' : 'status'}>
        {props.loading && <LoadingSpinner />}
        <h2>{props.title}</h2>
        {props.children}
        <div className='gigs-actions'>
            {props.retry && (
                <Button primary onClick={props.retry}>
                    Try again
                </Button>
            )}
            {props.back && <Link to={GIGS_PATH}>View other gigs</Link>}
        </div>
    </section>
)

/** Renders the legacy job facts using existing platform icons and semantic labels. */
export const GigFacts: FC<{ job: Gig; detailed?: boolean }> = props => {
    const hours = gigField(props.job, 'Hours per week')
    const facts = [
        { Icon: IconOutline.LocationMarkerIcon, label: 'Location', value: props.job.country || 'Anywhere' },
        { Icon: IconOutline.CurrencyDollarIcon, label: 'Compensation', value: gigCompensation(props.job) },
        { Icon: IconOutline.CalendarIcon, label: 'Duration', value: gigDuration(props.job) },
        ...(props.detailed
            ? [
                {
                    Icon: IconOutline.ClockIcon,
                    label: 'Hours',
                    value: hours === 'n/a' ? hours : `${hours} hours / week`,
                },
                {
                    Icon: IconOutline.GlobeIcon,
                    label: 'Working hours',
                    value: gigField(props.job, 'Timezone'),
                },
            ]
            : []),
    ]
    return (
        <dl className='gigs-facts'>
            {facts.map(fact => (
                <div key={fact.label}>
                    <fact.Icon width={20} height={20} aria-hidden />
                    <div>
                        <dt>{fact.label}</dt>
                        <dd>{fact.value}</dd>
                    </div>
                </div>
            ))}
        </dl>
    )
}

/** Renders a public listing card with featured/tag indicators, skills, compensation, and its detail link. */
export const GigCard: FC<{ job: Gig; compact?: boolean }> = props => {
    const tag = gigField(props.job, 'Job Tag', '')
    return (
        <article className={`gigs-card${props.compact ? ' gigs-card-compact' : ''}`}>
            <div className='gigs-card-heading'>
                <h2>
                    <Link to={`${GIGS_PATH}/${props.job.slug}`}>{props.job.name}</Link>
                </h2>
                <div className='gigs-tags'>
                    {gigFlag(props.job, 'Featured') && <span className='gigs-featured'>Featured</span>}
                    {tag && <span>{tag}</span>}
                </div>
            </div>
            <div className='gigs-skills'>
                {gigSkills(props.job)
                    .slice(0, props.compact ? 2 : 5)
                    .map(skill => (
                        <span key={skill}>{skill}</span>
                    ))}
            </div>
            <GigFacts job={props.job} />
            {!props.compact && (
                <Link className='gigs-button' to={`${GIGS_PATH}/${props.job.slug}`}>
                    View details
                </Link>
            )}
        </article>
    )
}

/** Renders sanitized authored HTML or Markdown; removes styles and unsafe URLs before inserting markup. */
export const GigContent: FC<{ text: string; markdown?: boolean }> = props => (
    <div
        className='gigs-content'
        dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(props.markdown ? marked.parse(props.text) : props.text, {
                FORBID_ATTR: ['style'],
                FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select'],
            }),
        }}
    />
)

/** Loads a candidate policy only while its accessible shared modal is open; failures expose a retry. */
export const GigPolicy: FC<{ id?: string; title: string; close: () => void }> = props => {
    const { data, error, mutate }: SWRResponse<string> = useSWR(
        props.id ? ['gigs-policy', props.id] : undefined,
        (_key: string, id: string) => getGigPolicy(id),
        { shouldRetryOnError: false },
    )
    return (
        <BaseModal open={!!props.id} onClose={props.close} title={props.title} size='lg'>
            <div className='gigs-app'>
                {error ? (
                    <GigState
                        title='Unable to load this policy'
                        retry={() => {
                            mutate()
                        }}
                    />
                ) : data ? (
                    <GigContent text={data} markdown />
                ) : (
                    <GigState title='Loading policy…' loading />
                )}
            </div>
        </BaseModal>
    )
}
