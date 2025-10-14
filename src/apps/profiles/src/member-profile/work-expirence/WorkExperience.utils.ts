export const IndustryEnumToLabel: {
    [key: string]: string
} = {
    ConsumerGoods: 'Consumer goods',
    PublicSector: 'Public sector',
    TechAndTechnologyService: 'Tech & technology services',
    TravelAndHospitality: 'Travel & hospitality',
}

export const IndustryLabelToEnum: {
    [key: string]: string
} = {
    'Consumer goods': 'ConsumerGoods',
    'Public sector': 'PublicSector',
    'Tech & technology services': 'TechAndTechnologyService',
    'Travel & hospitality': 'TravelAndHospitality',
}

export const getIndustryOptionValues = (v: string): string => {
    const values = Object.values(IndustryEnumToLabel)
    const keys = Object.keys(IndustryEnumToLabel)
    if (values.includes(v)) {
        return IndustryLabelToEnum[v]
    }

    if (keys.includes(v)) {
        return IndustryEnumToLabel[v]
    }

    return v
}

export const getIndustryOptionLabels = (v: string): string => {
    const keys = Object.keys(IndustryEnumToLabel)
    if (keys.includes(v)) {
        return IndustryEnumToLabel[v]
    }

    return v
}
