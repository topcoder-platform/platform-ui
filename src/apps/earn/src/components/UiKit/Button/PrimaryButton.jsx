import { Button } from "~/libs/ui"

export const PrimaryButton = (props) => (
    <Button
        buttonStyle='primary'
        disable={props.disabled}
        className={props.className}
        route={props.to}
        label={props.children}
    />
)