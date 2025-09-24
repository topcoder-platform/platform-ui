/**
 * Util for other check
 */
import AmazonS3URI from 'amazon-s3-uri'

import { EnvironmentConfig } from '~/config'

import { ValidateS3URIResult } from '../models'

/**
 * Check if object is date
 * @param date date object
 * @returns true if object is date
 */
export function checkIsDateObject(date: any): boolean {
    return Object.prototype.toString.call(date) === '[object Date]'
}

/**
 * Check if object is number
 * @param numberObject number object
 * @returns true if object is number
 */
export function checkIsNumberObject(numberObject: any): boolean {
    return typeof numberObject === 'number'
}

/**
 * Validate s3 url
 * @param fileURL file url
 * @returns resolve to validate result
 */
export function validateS3URI(
    fileURL: string,
): ValidateS3URIResult {
    try {
        const { region, bucket, key }: AmazonS3URI = AmazonS3URI(fileURL)
        if (
            region !== EnvironmentConfig.ADMIN.AWS_REGION
            || bucket !== EnvironmentConfig.ADMIN.AWS_DMZ_BUCKET
        ) {
            return { isValid: false }
        }

        return {
            bucket: bucket ?? undefined,
            isValid: true,
            key: key ?? undefined,
        }
    } catch (error) {}

    return { isValid: false }
}
