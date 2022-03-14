import classNames from 'classnames'
import { FC } from 'react'

interface ButtonProps {
    readonly className?: string
    readonly label: string
    readonly onClick?: (event?: any) => void
    readonly size?: 'sm' | 'md' | 'lg' | 'xl'
    readonly type?: 'primary' | 'secondary' | 'tertiary' | 'text'
    readonly url?: string
}

const Button: FC<ButtonProps> = (props: ButtonProps) => {

    // if there is no url or click handler, we hava a prob
    if (!props.url && !props.onClick) {
        throw new Error(`button has neither a url or a click handler`)
    }

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={classNames(
                    'button',
                    props.className,
                    props.type || 'primary',
                    `button-${props.size || 'md'}`
                )}
                href={props.url}
            >
                {props.label}
            </a>
        )
    }

    return <></>
}

export default Button
