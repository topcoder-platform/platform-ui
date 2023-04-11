import { Button } from "~/libs/ui"

export const DangerButton = (props) => (
    <Button
        buttonStyle='secondary'
        disable={props.disabled}
        className={props.className}
        route={props.to}
        label={props.children}
    />
)