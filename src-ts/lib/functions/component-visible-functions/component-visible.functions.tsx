import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from 'react'

export interface ComponentVisible {
    isComponentVisible: boolean
    ref: MutableRefObject<any>
    setIsComponentVisible: Dispatch<SetStateAction<boolean>>
}

export function useHideClickOutside(isVisible: boolean): ComponentVisible {

    const [isComponentVisible, setIsComponentVisible]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState(isVisible)

    const ref: MutableRefObject<any> = useRef(undefined)

    function onClick(event: globalThis.MouseEvent): void {
        setIsComponentVisible(!!ref.current?.contains(event.target))
    }

    useEffect(() => {
        document.addEventListener('click', onClick, true)
        return () => {
            document.removeEventListener('click', onClick, true)
        }
    }, [])

    return { ref, isComponentVisible, setIsComponentVisible }
}
