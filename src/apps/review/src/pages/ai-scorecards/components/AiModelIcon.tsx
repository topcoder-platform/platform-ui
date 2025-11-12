import { FC, useCallback, useRef } from 'react'

import iconDeepseekAi from '~/apps/review/src/lib/assets/icons/deepseek.svg'

import { AiWorkflow } from '../../../lib/hooks'

interface AiModelIconProps {
    model: AiWorkflow['llm']
}

const AiModelIcon: FC<AiModelIconProps> = props => {
    const llmIconImgRef = useRef<HTMLImageElement>(null)

    const handleError = useCallback(() => {
        if (!llmIconImgRef.current) {
            return
        }

        llmIconImgRef.current.src = iconDeepseekAi
    }, [])

    return (
        <img src={props.model.icon} alt={props.model.name} onError={handleError} ref={llmIconImgRef} />
    )
}

export default AiModelIcon
