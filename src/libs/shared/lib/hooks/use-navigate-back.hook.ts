import { NavigateFunction, useNavigate } from 'react-router-dom'

export type NavigateBackFunction = (fallbackUrl: string) => void
type useNavigateBackType = () => NavigateBackFunction

export const useNavigateBack: useNavigateBackType = (): NavigateBackFunction => {
    const navigate: NavigateFunction = useNavigate()
    return (fallbackUrl: string) => {
        const currentPageHref: string = window.location.href

        window.history.go(-1)

        setTimeout(() => {
            // go back didn't work, navigate to desired fallback url
            if (window.location.href === currentPageHref) {
                navigate(fallbackUrl)
            }
        }, 30)
    }
}
