import { FC, SVGProps } from 'react'

import { ButtonSize, ButtonStyle, ButtonType } from '../button'

export interface FormButton {
    readonly buttonStyle?: ButtonStyle
    hidden?: boolean,
    icon?: FC<SVGProps<SVGSVGElement>>
    readonly isReset?: boolean
    readonly isSubmit?: boolean
    label?: string
    readonly notTabble?: boolean
    onClick?: (event?: any) => void
    readonly route?: string
    readonly size?: ButtonSize
    readonly type?: ButtonType
    readonly url?: string
}
