import { Button } from "../../../../../src-ts/lib"

export const DangerButton = (props) => (
    <Button
        buttonStyle='secondary'
        disable={props.disabled}
        className={props.className}
        route={props.to}
        label={props.children}
    />
)