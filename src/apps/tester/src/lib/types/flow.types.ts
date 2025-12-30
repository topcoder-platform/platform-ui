export type FlowVariant =
    | 'full'
    | 'first2finish'
    | 'topgear'
    | 'topgearLate'
    | 'design'
    | 'designFailScreening'
    | 'designFailReview'
    | 'designSingle'

export type FlowStep = {
    id: string
    label: string
}

export type PrizeTuple = [number, number, number]
