import { ButtonProps } from '../button/Button'

export interface FormButton extends ButtonProps {
    readonly isReset?: boolean
    readonly order: number
}
