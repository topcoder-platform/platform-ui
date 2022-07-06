import classNames from 'classnames'
import {
    ChangeEvent,
    createRef,
    Dispatch,
    FC,
    MouseEvent,
    RefObject,
    SetStateAction,
    useEffect,
    useState,
} from 'react'

import { Button } from '../../../../button'
import '../../../../styles/index.scss'
import { IconSolid } from '../../../../svgs'
import { InputWrapper } from '../input-wrapper'

import styles from './InputRating.module.scss'

interface InputRatingProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly tabIndex: number
    readonly value?: string | number
}

const InputRating: FC<InputRatingProps> = (props: InputRatingProps) => {

    const [rating, setRating]: [number | undefined, Dispatch<SetStateAction<number | undefined>>] = useState<number | undefined>(!!props.value ? (+props.value / 2) : undefined)

    const inputRef: RefObject<HTMLInputElement> = createRef<HTMLInputElement>()

    const stars: Array<JSX.Element> = []
    // ratings are base 10, but we're only showing 5 stars,
    // so only display buttons for 2, 4, 6, 8, and 10
    for (let index: number = 2; index <= 10; index++) {
        const className: string = !!rating && rating >= index ? 'orange-100' : 'black-20'
        const element: JSX.Element = (
            <Button
                buttonStyle='icon'
                className={className}
                icon={IconSolid.StarIcon}
                name={`${index}`}
                onClick={() => setRating(index)}
                size='xl'
                tabIndex={-1}
                elementType='div'
            />
        )
        stars.push(element)
        index++ // incrementing by 2, so do a 2nd increment each time through the loop
    }

    useEffect(() => {

        if (!!inputRef.current?.value && props.value !== inputRef.current.value) {
            inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        }

    }, [rating])

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            hint={''}
            label={''}
            type='rating'
            className={styles['rating-input-wrapper']}
        >
            <div className={styles['ratings-container']}>
                {stars}
            </div>
            <input
                name={props.name}
                onInput={props.onChange}
                ref={inputRef}
                type='hidden'
                value={rating}
            />
        </InputWrapper>
    )
}

export default InputRating
