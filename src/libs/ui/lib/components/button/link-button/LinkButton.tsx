import { AnchorHTMLAttributes, FC, ReactNode } from 'react'
import { Link, LinkProps, To } from 'react-router-dom'
import { omit, pick } from 'lodash'

import Button, { ButtonProps } from '../Button'

export type LinkButtonProps = ButtonProps & LinkProps & {
    to: To
}

const linkPropsList: string[] = [
    'to',
    'reloadDocument',
    'replace',
    'state',
    'preventScrollReset',
    'relative',
]

const aPropsList: string[] = [
    'download',
    'href',
    'media',
    'ping',
    'rel',
    'target',
    'referrerPolicy',
]

const LinkButton: FC<LinkButtonProps> = props => {
    const buttonProps: ButtonProps = omit(props, [
        ...linkPropsList,
        ...aPropsList,
    ])

    const aProps: AnchorHTMLAttributes<HTMLAnchorElement> = pick(props, aPropsList)
    const linkProps: Partial<LinkProps> = pick(props, linkPropsList)

    const button: ReactNode = <Button {...buttonProps} />

    if (props.disabled || !props.to) {
        return button
    }

    const useAnchor: boolean = typeof props.to === 'string' && (
        !!props.to.match(/^#|https?:\/\//i)
        || props.target === '_blank'
    )

    if (useAnchor) {
        return <a href={(props.to) as string} {...aProps}>{button}</a>
    }

    return <Link {...linkProps} to={props.to as To}>{button}</Link>
}

export default LinkButton
