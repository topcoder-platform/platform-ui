import { FC, MutableRefObject, ReactNode, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

interface PortalProps {
    children: ReactNode
    className?: string,
    portalId?: string
    portalNode?: HTMLElement
    portalRef?: MutableRefObject<HTMLElement>,
}

const Portal: FC<PortalProps> = ({
    portalId,
    portalNode,
    children,
    className,
    portalRef,
}: PortalProps) => {

    const defaultPortalNode: HTMLElement = useMemo(() => {
        if (portalNode) {
            return
        }

        if (portalId) {
            return document.getElementById(portalId)
        }

        const backupHtmlNode: HTMLElement = document.createElement('div')
        if (className) {
            backupHtmlNode.classList.add(className)
        }
        document.body.appendChild(backupHtmlNode)
        return backupHtmlNode
    }, [
        portalId,
        portalNode,
        className,
    ]) as HTMLElement

    useEffect(() => {
        return () => {
            if (defaultPortalNode) {
                document.body.removeChild(defaultPortalNode)
            }
        }
    }, [defaultPortalNode])

    if (portalRef) {
        portalRef.current = portalNode ?? defaultPortalNode
    }

    return createPortal(children, portalNode ?? defaultPortalNode)
}

export default Portal
