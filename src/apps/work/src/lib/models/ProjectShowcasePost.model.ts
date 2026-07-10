import { SortOrder } from '../utils/sorting.utils'

import { PaginationModel } from './Pagination.model'

export interface ProjectShowcasePostTaxonomyItem {
    id: string
    name: string
}

export interface ProjectShowcasePostMedia {
    id: string
    type: string
    url: string
}

export interface ProjectShowcasePostChallengeMetadataSkill {
    id: string
    name: string
}

export interface ProjectShowcasePostChallengeMetadataItem {
    challengeId: string
    numOfSubmissions: number
    numOfRegistrants: number
    skills: ProjectShowcasePostChallengeMetadataSkill[]
    track: string
    countries: string[]
}

export interface ProjectShowcasePost {
    id: string
    title: string
    content?: string
    status: string
    projectId?: string
    challengeIds?: string[]
    createdAt: string
    createdById: number
    createdByHandle?: string
    industries: ProjectShowcasePostTaxonomyItem[]
    categories: ProjectShowcasePostTaxonomyItem[]
    media?: ProjectShowcasePostMedia[]
}

export interface ProjectShowcasePostDetails extends ProjectShowcasePost {
    projectTitle: string
    challengeMetadata: ProjectShowcasePostChallengeMetadataItem[]
}

export interface ProjectShowcasePostFilters {
    keyword?: string
    status?: string
    industryId?: string
    categoryId?: string
}

export interface FetchProjectShowcasePostsParams extends ProjectShowcasePostFilters {
    projectId?: string
    page?: number
    perPage?: number
    sortBy?: string
    sortOrder?: SortOrder
}

export interface FetchProjectShowcasePostsResponse {
    posts: ProjectShowcasePost[]
    metadata: PaginationModel
}

export interface ProjectShowcasePostCategory {
    id: string
    name: string
}

export type ProjectShowcasePostIndustry = ProjectShowcasePostCategory
