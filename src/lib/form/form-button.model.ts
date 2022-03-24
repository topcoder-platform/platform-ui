import { ButtonProps } from '../button/Button'

export interface FormButton extends ButtonProps {
    readonly isReset?: boolean
    readonly isSave?: boolean
    readonly order: number
}
