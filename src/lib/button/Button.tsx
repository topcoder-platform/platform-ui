import classNames from 'classnames'
import { FC } from 'react'

interface ButtonProps {
    readonly buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'text'
    readonly className?: string
    readonly disable?: boolean
    readonly label: string
    readonly onClick?: (event?: any) => void
    readonly size?: 'sm' | 'md' | 'lg' | 'xl'
    readonly type?: 'button' | 'submit'
    readonly url?: string
}

const Button: FC<ButtonProps> = (props: ButtonProps) => {

    const classes: string = classNames(
        'button',
        props.className,
        props.buttonStyle || 'primary',
        `button-${props.size || 'md'}`
    )

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={classes}
                href={props.url}
            >
                {props.label}
            </a>
        )
    }

    // if there is no url and no click handler, we hava a prob
    if (!props.onClick) {
        throw new Error(`button has neither a url or a click handler`)
    }

    // create a safe click handler that isn't null so the compiler
    // doesn't complain
    const clickHandler: (event: any) => void = props.onClick

    return (
        <button
            className={classes}
            disabled={!!props.disable}
            onClick={event => clickHandler(event)}
            type={props.type || 'button'}
        >
            {props.label}
        </button>
    )
}

export default Button
