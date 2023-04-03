import { Button } from "../../../../../src-ts/lib"

export const PrimaryButton = (props) => (
    <Button
        buttonStyle='primary'
        disable={props.disabled}
        className={props.className}
        route={props.to}
        label={props.children}
    />
)