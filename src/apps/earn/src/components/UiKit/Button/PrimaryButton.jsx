import { Button } from "~/libs/ui"

export const PrimaryButton = (props) => (
    // TODO: HANDLE `props.to`
    <Button
        primary
        disabled={props.disabled}
        className={props.className}
        label={props.children}
    />
)
