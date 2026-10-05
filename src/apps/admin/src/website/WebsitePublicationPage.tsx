import { FC, useEffect, useRef, useState } from 'react'

import { Button } from '~/libs/ui'

import { PageWrapper } from '../lib'

import {
    getPublication,
    getPublicationConfig,
    publicationEndpoint,
    publicationFinished,
    publishWebsite,
    WebsitePublication,
    WebsitePublicationConfig,
} from './website-publication.service'
import styles from './WebsitePublicationPage.module.scss'

const storageKey = `website-publication:${publicationEndpoint}`

/** Formats an API failure for editors without exposing request headers or credentials. */
function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unable to reach website publishing. Please try again.'
}

/**
 * Gives administrators a content publication action and polls the resulting release through completion.
 * Keeps the pipeline ID for this browser session so reloading resumes observation of an active release.
 */
export const WebsitePublicationPage: FC = () => {
    const [config, setConfig] = useState<WebsitePublicationConfig>()
    const [publication, setPublication] = useState<WebsitePublication>()
    const [pipelineId, setPipelineId] = useState<string>(() => sessionStorage.getItem(storageKey) || '')
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const submittingRef = useRef(false)

    useEffect(() => {
        let mounted = true
        getPublicationConfig()
            .then(value => { if (mounted) setConfig(value) })
            .catch(reason => { if (mounted) setError(errorMessage(reason)) })
        return () => { mounted = false }
    }, [])

    useEffect(() => {
        if (!pipelineId) return undefined
        let mounted = true
        let timer: ReturnType<typeof setTimeout>
        const poll = async (): Promise<void> => {
            try {
                const result = await getPublication(pipelineId)
                if (!mounted) return
                setPublication(result)
                setError('')
                if (publicationFinished(result.status)) {
                    sessionStorage.removeItem(storageKey)
                    setPipelineId('')
                    return
                }
            } catch (reason) {
                if (!mounted) return
                setError(errorMessage(reason))
            }

            if (mounted) timer = setTimeout(poll, 5000)
        }

        poll()
        return () => {
            mounted = false
            clearTimeout(timer)
        }
    }, [pipelineId])

    /** Queues one release and starts polling its pipeline; repeated clicks are ignored while pending. */
    async function handlePublish(): Promise<void> {
        if (submittingRef.current || pipelineId) return
        submittingRef.current = true
        setSubmitting(true)
        setError('')
        try {
            const result = await publishWebsite()
            sessionStorage.setItem(storageKey, result.pipelineId)
            setPublication(result)
            setPipelineId(result.pipelineId)
        } catch (reason) {
            setError(errorMessage(reason))
        } finally {
            setSubmitting(false)
            submittingRef.current = false
        }
    }

    return (
        <PageWrapper pageTitle='Website Publishing'>
            <div className={styles.content}>
                <h4>
                    {config ? `${config.environment === 'production' ? 'Production' : 'Development'} website`
                        : 'Loading publishing settings…'}
                </h4>
                <p>
                    Publish approved content already promoted and published in this environment’s CMS.
                    Changed pages and pages using changed shared content will be rebuilt.
                    Search and redirects will also be updated.
                </p>
                <Button
                    primary
                    disabled={!config?.enabled || submitting || !!pipelineId}
                    onClick={handlePublish}
                >
                    {submitting || pipelineId ? 'Publishing…' : 'Publish Website'}
                </Button>
                {config && !config.enabled && (
                    <p>Website publishing has not been enabled for this environment.</p>
                )}
                {error && <p role='alert'>{error}</p>}
                {publication && (
                    <div aria-live='polite' role='status'>
                        <p>
                            {publication.status === 'success'
                                ? 'Website publication completed.'
                                : `Publication status: ${publication.status.replaceAll('_', ' ')}`}
                        </p>
                        <a href={publication.url} target='_blank' rel='noreferrer'>View publication details</a>
                    </div>
                )}
            </div>
        </PageWrapper>
    )
}
