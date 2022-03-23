import classNames from 'classnames'
import { FC } from 'react'
<<<<<<< HEAD
=======
import { Link } from 'react-router-dom'

import styles from './Button.module.scss'
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

interface ButtonProps {
    readonly buttonStyle?: 'primary' | 'secondary' | 'tertiary' | 'text'
    readonly className?: string
    readonly disable?: boolean
    readonly label: string
    readonly onClick?: (event?: any) => void
<<<<<<< HEAD
    readonly size?: 'sm' | 'md' | 'lg' | 'xl'
=======
    readonly route?: string
    readonly size?: 'sm' | 'md' | 'lg' | 'xl'
    readonly tabIndex: number
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    readonly type?: 'button' | 'submit'
    readonly url?: string
}

const Button: FC<ButtonProps> = (props: ButtonProps) => {

<<<<<<< HEAD
    const classes: string = classNames(
        'button',
        props.className,
        props.buttonStyle || 'primary',
        `button-${props.size || 'md'}`
    )
=======
    const classes: string = getButtonClasses(props)
    const clickHandler: (event?: any) => void = getClickHandler(props)
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={classes}
                href={props.url}
<<<<<<< HEAD
=======
                onClick={clickHandler}
                tabIndex={props.tabIndex}
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            >
                {props.label}
            </a>
        )
    }

<<<<<<< HEAD
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
=======
    if (!!props.route) {
        return (
            <Link
                className={classes}
                onClick={clickHandler}
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
            onClick={clickHandler}
            tabIndex={props.tabIndex}
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
            type={props.type || 'button'}
        >
            {props.label}
        </button>
    )
}

<<<<<<< HEAD
=======
function getButtonClasses(props: ButtonProps): string {
    const classes: string = classNames(
        styles.button,
        props.className,
        !!props.buttonStyle ? styles[props.buttonStyle] : styles.primary,
        styles[`button-${props.size || 'md'}`],
        !!props.disable ? styles.disabled : undefined
    )
    return classes
}

function getClickHandler(props: ButtonProps): (event?: any) => void {
    return props.onClick || (() => undefined)
}

>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
export default Button
