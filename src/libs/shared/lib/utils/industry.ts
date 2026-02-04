export const IndustryEnumToLabel: {
  [key: string]: string
} = {
    ConsumerGoods: 'Consumer goods',
    Other: 'Others',
    PublicSector: 'Public sector',
    TechAndTechnologyService: 'Tech & technology services',
    TravelAndHospitality: 'Travel & hospitality',
}

export const IndustryLabelToEnum: {
  [key: string]: string
} = {
    'Consumer goods': 'ConsumerGoods',
    Others: 'Other',
    'Public sector': 'PublicSector',
    'Tech & technology services': 'TechAndTechnologyService',
    'Travel & hospitality': 'TravelAndHospitality',
}

export const getIndustryOptionValue = (v: string): string => {
    const values = Object.values(IndustryEnumToLabel)
    const keys = Object.keys(IndustryEnumToLabel)
    if (values.includes(v)) {
        return IndustryLabelToEnum[v]
    }

    if (keys.includes(v)) {
        return v
    }

    return v
}

export const getIndustryOptionLabel = (v: string): string => {
    const keys = Object.keys(IndustryEnumToLabel)
    if (keys.includes(v)) {
        return IndustryEnumToLabel[v]
    }

    return v
}

export const getIndustryOptionsWithOthersLast = (
    industries: string[],
): Array<{ label: string; value: string }> => {
    const industriesWithoutOthers = industries.filter(v => v !== 'Others')
    const sortedIndustries = [...industriesWithoutOthers].sort()

    // Always append 'Others' at the end
    const finalIndustries = [...sortedIndustries, 'Others']

    return finalIndustries.map(v => ({
        label: getIndustryOptionLabel(v),
        value: getIndustryOptionValue(v),
    }))
}
