import { Dispatch, SetStateAction } from "react"
import { useLocalStorage } from "../../../../lib"

export const useShowSurvey = (): [
    string,
    Dispatch<SetStateAction<string>>
] => {
    return useLocalStorage<string>('tca-show-survey', '');
}
