import { get } from 'lodash'
import { FC } from 'react'
import { Navigate, Params, useParams } from 'react-router-dom'

export interface RewriteProps {
    to: string
}

/**
 * Extends react-router-dom Navigate component to support rewriting of urls
 * Eg. or rewrite rules:
 * - /learn/* -> /* (redirects all learn pages to root)
 */
export const Rewrite: FC<RewriteProps> = props => {
    const params: Params = useParams()
    const rewriteTo: string = props.to.replace(
        /(:[a-z0-9*]+)|\*/ig,
        (match: string) => get(params, match.replace(':', ''), ''),
    )

    return (
        <Navigate to={rewriteTo} />
    )
}
