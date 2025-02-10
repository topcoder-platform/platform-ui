import { useEffect } from 'react'
import _ from 'lodash'

/**
 * Listens to the scroll events on a target element an its parents.
 * @param props.target The target element to listen for scroll events.
 * @param props.onScroll The callback triggered when scrolling.
 * @param props.throttleTime The throttle time (in milliseconds).
 */
export const useOnScroll = ({
    target,
    onScroll,
    throttleTime = 25,
}: {
  target?: HTMLElement | null
  onScroll: () => void
  throttleTime?: number
}) => {
    useEffect(() => {
        const targets: EventTarget[] = [window]

        let el: HTMLElement
        if (target) {
            el = target
            targets.push(target)
            while (el && el.parentElement) {
                el = el.parentElement
                targets.push(el)
            }
        }

        const handleScroll = _.throttle(() => {
            onScroll()
        }, throttleTime)

        targets.forEach(t => t.addEventListener('scroll', handleScroll))

        return () => {
            targets.forEach(t => t.removeEventListener('scroll', handleScroll))
        }
    }, [])
}
