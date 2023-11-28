import { FC, SVGProps } from 'react'

import { ButtonSize, ButtonTypes, ButtonVariants } from '../button'

export interface FormButton {
    readonly buttonStyle?: ButtonTypes
    readonly variant?: ButtonVariants
    readonly buttonLight?: boolean
    hidden?: boolean,
    icon?: FC<SVGProps<SVGSVGElement>>
    readonly isReset?: boolean
    readonly isSubmit?: boolean
    label?: string
    readonly notTabble?: boolean
    onClick?: (event?: any) => void
    readonly route?: string
    readonly size?: ButtonSize
    readonly type?: 'button'|'submit'
    readonly url?: string
}
