/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import useSWR, { SWRResponse } from 'swr'

import { authUrlLogin, ProfileContextData, useProfileContext } from '~/libs/core'
import { Button, LoadingSpinner } from '~/libs/ui'

import {
    ChallengeTermsModal,
    resolveChallengeTermDocuSignTemplateId,
} from '../components/ChallengeTermsModal'
import { ChallengeTerm } from '../models'
import { rootRoute } from '../opportunities.routes'
import { getChallengeTermDetails } from '../services'
import termStyles from '../components/ChallengeTermsModal.module.scss'

import styles from './TermsDetailPage.module.scss'

interface TermsDetailContentProps {
    memberId?: number
    termId: string
}

/**
 * Displays one agreement and opens the shared, verified acceptance flow.
 * The parent remounts this content when the route or member changes, preventing
 * another member's acceptance state or an obsolete dialog from being reused.
 *
 * @param props canonical or legacy term ID and the signed-in member ID, if any.
 * @returns agreement content, sign-in/acceptance actions, and retryable errors.
 * @throws Does not throw; Terms API failures are displayed with a retry action.
 */
const TermsDetailContent: FC<TermsDetailContentProps> = props => {
    const [agreementOpen, setAgreementOpen] = useState(false)
    const response: SWRResponse<ChallengeTerm, Error> = useSWR(
        ['opportunities:standalone-term', props.termId, props.memberId ?? 'anonymous'],
        () => getChallengeTermDetails({ id: props.termId }, { fresh: true }),
    )
    const term = response.data
    const isDocuSign = !!term && !!resolveChallengeTermDocuSignTemplateId(term)
    const signedIn = props.memberId !== undefined

    /**
     * Records the shared dialog's confirmed result in this member's page cache.
     * Called only after electronic acceptance or authoritative DocuSign verification.
     *
     * @returns a promise resolved when the accepted page state is saved.
     * @throws Propagates cache update failures to the dialog's retryable error state.
     */
    const completeAgreement = async (): Promise<void> => {
        if (!term) return
        await response.mutate({ ...term, agreed: true }, { revalidate: false })
        setAgreementOpen(false)
    }

    return (
        <main className={styles.page}>
            <div className={styles.content}>
                <Link className={styles.back} to={rootRoute || '/'}>Back to Opportunities</Link>
                <h1>{term?.title || 'Terms and NDA'}</h1>
                {response.error ? (
                    <div className={styles.status} role='alert'>
                        <p>We couldn&apos;t load this agreement. Please check the link or try again.</p>
                        <button onClick={() => response.mutate()} type='button'>Try again</button>
                    </div>
                ) : !term ? (
                    <div className={styles.status} role='status'>
                        <LoadingSpinner />
                        <span>Loading agreement…</span>
                    </div>
                ) : (
                    <>
                        {isDocuSign ? (
                            <p>This agreement is reviewed and signed through DocuSign.</p>
                        ) : term.text ? (
                            <article className={`${termStyles.term} ${styles.document}`}>
                                <div dangerouslySetInnerHTML={{
                                    __html: String(DOMPurify.sanitize(term.text, { FORBID_ATTR: ['style'] })),
                                }}
                                />
                            </article>
                        ) : (
                            <p>Open the agreement below to review its requirements.</p>
                        )}
                        <div className={styles.actions}>
                            {!signedIn ? (
                                <a href={authUrlLogin(window.location.href)}>Sign in to accept this agreement</a>
                            ) : term.agreed ? (
                                <p className={styles.success} role='status'>
                                    You have accepted this agreement.
                                </p>
                            ) : (
                                <Button
                                    className={termStyles.modalAction}
                                    disabled={response.isValidating}
                                    label={isDocuSign ? 'Review and sign' : 'Review and accept'}
                                    noCaps
                                    onClick={() => setAgreementOpen(true)}
                                    primary
                                />
                            )}
                        </div>
                        {signedIn && agreementOpen && (
                            <ChallengeTermsModal
                                memberId={props.memberId}
                                mode='agree'
                                onClose={() => setAgreementOpen(false)}
                                onComplete={completeAgreement}
                                open
                                terms={[{ id: term.id || props.termId, title: term.title }]}
                            />
                        )}
                    </>
                )}
            </div>
        </main>
    )
}

/**
 * Hosts email deep links at `/opportunities/terms/detail/:termId` (or
 * `/terms/detail/:termId` on the dedicated Opportunities host). Public visitors
 * can read electronic terms; acceptance and DocuSign require sign-in.
 *
 * @returns member-scoped terms content after authentication initialization.
 * @throws Does not throw; missing IDs and initialization render in-page states.
 */
const TermsDetailPage: FC = () => {
    const { termId }: Readonly<{ termId?: string }> = useParams<{ termId: string }>()
    const { initialized, isLoggedIn, profile }: ProfileContextData = useProfileContext()

    if (!initialized) {
        return (
            <div className={styles.status} role='status'>
                <LoadingSpinner />
                Loading agreement…
            </div>
        )
    }

    if (!termId) return <p role='alert'>This agreement link is missing its identifier.</p>

    return (
        <TermsDetailContent
            key={`${termId}:${isLoggedIn ? profile?.userId : 'anonymous'}`}
            memberId={isLoggedIn ? profile?.userId : undefined}
            termId={termId}
        />
    )
}

export default TermsDetailPage
