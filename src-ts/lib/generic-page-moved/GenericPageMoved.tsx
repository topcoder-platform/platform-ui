import { FC, useEffect } from 'react'

import { Button } from '../button'

import styles from './GenericPageMoved.module.scss'

interface GenericPageMovedProps {
    pageTitle: string
    newPageUrl: string
}

const GenericPageMoved: FC<GenericPageMovedProps> = (props: GenericPageMovedProps) => {

    // setup auto redirect in 5sec.
    useEffect(() => {
        const to: ReturnType<typeof setTimeout> = setTimeout(() => {
            window.location.href = props.newPageUrl
        }, 5000)

        return () => clearTimeout(to)
    }, [props.newPageUrl])

    return (
        <div className={styles.wrap}>
            <h3>This page has moved.</h3>
            <Button
                label={`Navigate to ${props.pageTitle}`}
                url={props.newPageUrl}
            />
            <p>We will automatically redirect you in 5 seconds...</p>
        </div>
    )
}

export default GenericPageMoved
