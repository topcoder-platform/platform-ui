import {
    MouseEvent as RMouseEvent,
    MouseEventHandler,
    MutableRefObject,
    useCallback,
    useRef
} from 'react'

export interface UseHoverElementValue {
    onMouseEnter: MouseEventHandler<HTMLDivElement>
    onMouseLeave: MouseEventHandler<HTMLDivElement>
}

/**
 * Create event handlers for hover in/hover out for the passed element
 * @param el Html element to register the event handlers for
 * @param cb Callback function to be called on hover in/hover out of provided element
 */
export function useOnHoverElement(
    el: HTMLElement | null,
    cb: (isVisible: boolean) => void,
    enabled: boolean = true
): UseHoverElementValue | {} {
    const counter: MutableRefObject<number> = useRef(0)

    const handleHover: (ev: RMouseEvent<Element, MouseEvent>) => void = useCallback((ev: RMouseEvent<Element, MouseEvent>) => {
        const nextVal: number = Math.max(0, counter.current + (ev.type === 'mouseenter' ? 1 : -1))
        if (!!nextVal !== !!counter.current) {
            cb(nextVal > 0)
        }

        counter.current = nextVal
    }, [cb])

    return enabled ? {
        onMouseEnter: handleHover,
        onMouseLeave: handleHover,
    } : {}
}
