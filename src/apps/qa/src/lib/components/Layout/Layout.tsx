/**
 * Basic layout shell for the QA app.
 */
import { FC, PropsWithChildren } from 'react'

export const Layout: FC<PropsWithChildren> = props => (
    <div className='qa-app-layout'>{props.children}</div>
)

export default Layout
