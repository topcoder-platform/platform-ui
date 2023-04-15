import { Button } from "~/libs/ui"

export const DangerButton = (props) => (
    <Button
        secondary
        disable={props.disabled}
        className={props.className}
        label={props.children}
        variant='danger'
    />
)
