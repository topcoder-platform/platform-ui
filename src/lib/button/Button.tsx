import classNames from 'classnames'
import { FC } from 'react'
import { Link } from 'react-router-dom'

import styles from './Button.module.scss'

interface ButtonProps {
    readonly buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'text'
    readonly className?: string
    readonly disable?: boolean
    readonly label: string
    readonly onClick?: (event?: any) => void
    readonly route?: string
    readonly size?: 'sm' | 'md' | 'lg' | 'xl'
    readonly tabIndex: number
    readonly type?: 'button' | 'submit'
    readonly url?: string
}

const Button: FC<ButtonProps> = (props: ButtonProps) => {

    const classes: string = classNames(
        styles.button,
        props.className,
        !!props.buttonStyle ? styles[props.buttonStyle] : styles.primary,
        styles[`button-${props.size || 'md'}`],
        !!props.disable ? styles.disabled : undefined
    )

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={classes}
                href={props.url}
                tabIndex={props.tabIndex}
            >
                {props.label}
            </a>
        )
    }

    if (!!props.route) {
        return (
            <Link
                className={classes}
                tabIndex={props.tabIndex}
                to={props.route}
            >
                {props.label}
            </Link>
        )
    }

    return (
        <button
            className={classes}
            onClick={() => (props.onClick || undefined)}
            tabIndex={props.tabIndex}
            type={props.type || 'button'}
        >
            {props.label}
        </button>
    )
}

export default Button
