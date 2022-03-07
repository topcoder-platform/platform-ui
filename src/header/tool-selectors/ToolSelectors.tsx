import { FC } from 'react'

import ToolSelectorsNarrow from './tool-selectors-narrow/ToolSelectorsNarrow'
import ToolSelectorsWide from './tool-selectors-wide/ToolSelectorsWide'

interface ToolSelectorsProps {
    isWide: boolean
}

const ToolSelectors: FC<ToolSelectorsProps> = (props: ToolSelectorsProps) => {
    return props.isWide ? <ToolSelectorsWide /> : <ToolSelectorsNarrow />
}

export default ToolSelectors
