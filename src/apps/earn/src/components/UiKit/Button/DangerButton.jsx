import { UiButton } from "~/libs/ui"

export const DangerButton = (props) => (
    <UiButton
        secondary
        disable={props.disabled}
        className={props.className}
        label={props.children}
        variant='danger'
    />
)
