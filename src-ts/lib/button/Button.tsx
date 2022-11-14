/* eslint-disable @typescript-eslint/no-explicit-any */
//  NEED to allow any in order to support intrinisic element types
import { FC, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { IconOutline } from '../svgs'
import '../styles/index.scss'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ButtonStyle = 'icon' | 'icon-bordered' | 'link' | 'primary' | 'secondary' | 'tertiary' | 'text'
export type ButtonType = 'button' | 'submit'

export interface ButtonProps {
    readonly buttonStyle?: ButtonStyle
    readonly className?: string
    readonly disable?: boolean
    readonly elementType?: keyof JSX.IntrinsicElements
    readonly hidden?: boolean
    readonly icon?: FC<SVGProps<SVGSVGElement>>
    readonly id?: string
    readonly label?: string
    readonly name?: string
    readonly onClick?: (event?: any) => void
    readonly rel?: string
    readonly route?: string
    readonly size?: ButtonSize
    readonly tabIndex?: number
    readonly target?: string
    readonly title?: string
    readonly type?: ButtonType
    readonly url?: string
}

const Button: FC<ButtonProps> = (props: ButtonProps) => {

    const classes: string = getButtonClasses(
        props.className,
        props.buttonStyle,
        props.size,
        props.disable,
        props.hidden,
    )
    const clickHandler: (event?: any) => void = getClickHandler(props.onClick)
    const content: JSX.Element = getButtonContent(props.buttonStyle, props.icon, props.label)

    // if there is a url, this is a link button
    if (!!props.url) {
        return (
            <a
                className={classes}
                href={props.url}
                onClick={clickHandler}
                rel={props.rel || props.target === '_blank' ? 'noreferrer' : ''}
                role='button'
                tabIndex={props.tabIndex}
                title={props.title}
                target={props.target}
            >
                {content}
            </a>
        )
    }

    if (!!props.route) {
        return (
            <Link
                className={classes}
                onClick={clickHandler}
                tabIndex={props.tabIndex}
                title={props.title}
                to={props.route}
            >
                {content}
            </Link>
        )
    }

    // if this is a button type or isn't a generic type,
    // return a button explicitly
    if (!!props.type || !props.elementType) {
        return (
            <button
                className={classes}
                disabled={!!props.disable}
                name={props.name}
                onClick={clickHandler}
                tabIndex={props.tabIndex}
                title={props.title}
                // eslint-disable-next-line react/button-has-type
                type={props.type || 'button'}
                id={props.id}
                value={props.id}
            >
                {content}
            </button>
        )
    }

    // this is a different element, so construct and render it
    const ButtonElement: keyof JSX.IntrinsicElements = props.elementType
    return (
        <ButtonElement
            className={classes}
            disabled={!!props.disable}
            name={props.name}
            onClick={clickHandler}
            tabIndex={props.tabIndex}
            title={props.title}
        >
            {content}
        </ButtonElement>
    )
}

function getButtonClasses(
    className?: string,
    buttonStyle?: ButtonStyle,
    size?: ButtonSize,
    disable?: boolean,
    hidden?: boolean,
): string {
    const classes: string = classNames(
        'button',
        className,
        buttonStyle || 'primary',
        `button-${size || 'md'}`,
        { disabled: disable },
        { hidden },
    )
    return classes
}

function getButtonContent(
    buttonStyle?: ButtonStyle,
    icon?: FC<SVGProps<SVGSVGElement>>,
    label?: string,
): JSX.Element {

    // if this is a link, just add the label and the arrow icon
    if (buttonStyle === 'link') {
        return (
            <>
                {label}
                <IconOutline.ArrowRightIcon />
            </>
        )
    }

    const Icon: FC<SVGProps<SVGSVGElement>> | undefined = icon
    return (
        <>
            {!!Icon && <Icon />}
            {label}
        </>
    )
}

function getClickHandler(onClick?: (event?: any) => void): ((event?: any) => void) {

    return onClick || (() => undefined)
}

export default Button
