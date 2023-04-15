import { UiButton } from "~/libs/ui"

export const PrimaryButton = (props) => (
    // TODO: HANDLE `props.to`
    <UiButton
        primary
        disabled={props.disabled}
        className={props.className}
        label={props.children}
    />
)
