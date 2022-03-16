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

    const clickHandler: (event: any) => void = props.onClick || (() => undefined)

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
