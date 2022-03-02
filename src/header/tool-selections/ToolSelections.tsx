import { FC } from 'react'

import ToolSelectionsNarrow from './tool-selections-narrow/ToolSelectionsNarrow'
import ToolSelectionsWide from './tool-selections-wide/ToolSelectionsWide'

interface ToolSelectionsProps {
    isWide: boolean
}

const ToolSelections: FC<ToolSelectionsProps> = (props: ToolSelectionsProps) => {
    return props.isWide ? <ToolSelectionsWide /> : <ToolSelectionsNarrow />
}

export default ToolSelections
