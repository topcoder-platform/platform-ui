import { FC, MutableRefObject, ReactNode, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
    children: ReactNode
    className?: string,
    portalId?: string
    portalNode?: HTMLElement
    portalRef?: MutableRefObject<HTMLElement>,
}

const Portal: FC<PortalProps> = (props: PortalProps) => {
    const portalNode: HTMLElement | null = props.portalId
        ? document.getElementById(props.portalId)
        :  props.portalNode ?? null

    const defaultPortalNode: HTMLElement = useMemo(() => {
        if (props.portalId || props.portalNode) {
            return
        }

        const backupHtmlNode: HTMLElement = document.createElement('div')
        if (props.className) {
            backupHtmlNode.classList.add(props.className)
        }
        document.body.appendChild(backupHtmlNode)
        return backupHtmlNode
    }, [props.portalId, props.portalNode, props.className]) as HTMLElement

    useEffect(() => {
        return () => {
            if (defaultPortalNode && document.body.contains(defaultPortalNode)) {
                document.body.removeChild(defaultPortalNode)
            }
        }
    }, [defaultPortalNode])

    if (props.portalRef) {
        props.portalRef.current = portalNode ?? defaultPortalNode
    }

    return createPortal(props.children, portalNode ?? defaultPortalNode)
}

export default Portal
