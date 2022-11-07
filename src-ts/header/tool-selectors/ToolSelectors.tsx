import { FC } from 'react'

import { ToolSelectorsNarrow } from './tool-selectors-narrow'
import { ToolSelectorsWide } from './tool-selectors-wide'

interface ToolSelectorsProps {
    isWide: boolean
}

const ToolSelectors: FC<ToolSelectorsProps> = (props: ToolSelectorsProps) => props.isWide ? <ToolSelectorsWide /> : <ToolSelectorsNarrow />

export default ToolSelectors
