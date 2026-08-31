import { AxiosError } from 'axios'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

export interface EmailChangeOtpResponse {
    expiresIn: number
}

export interface EmailChangeOtpVerificationResponse extends EmailChangeOtpResponse {
    verificationToken: string
}

export interface EmailChangeResponse {
    email: string
}

const usersUrl: string = `${EnvironmentConfig.API.V6}/users`

/**
 * Requests a six-digit ownership code at the member's current primary email.
 *
 * @param userId member ID whose email will be changed.
 * @returns the code lifetime in seconds.
 * @throws rejects when the identity API cannot send the code.
 */
export async function requestEmailChangeOtpAsync(
    userId: number,
): Promise<EmailChangeOtpResponse> {
    return xhrPostAsync<Record<string, never>, EmailChangeOtpResponse>(
        `${usersUrl}/${userId}/email-change/otp`,
        {},
    )
}

/**
 * Verifies the ownership code sent to the member's current primary email.
 *
 * @param userId member ID that requested the code.
 * @param otp six-digit ownership code.
 * @returns a short-lived proof used to submit a new address.
 * @throws rejects when the code is invalid, expired, or blocked.
 */
export async function verifyEmailChangeOtpAsync(
    userId: number,
    otp: string,
): Promise<EmailChangeOtpVerificationResponse> {
    return xhrPostAsync<
        { param: { otp: string } },
        EmailChangeOtpVerificationResponse
    >(
        `${usersUrl}/${userId}/email-change/verify-otp`,
        { param: { otp } },
    )
}

/**
 * Sends a validation link to the proposed new primary email.
 *
 * @param userId member ID whose email will be changed.
 * @param email proposed new primary email.
 * @param verificationToken proof that the current email OTP was verified.
 * @returns the normalized address that received the validation link.
 * @throws rejects when the address or proof is invalid.
 */
export async function initiateEmailChangeAsync(
    userId: number,
    email: string,
    verificationToken: string,
): Promise<EmailChangeResponse> {
    return xhrPostAsync<
        { param: { email: string, verificationToken: string } },
        EmailChangeResponse
    >(
        `${usersUrl}/${userId}/email-change`,
        { param: { email, verificationToken } },
    )
}

/**
 * Completes the deferred email update from the validation link.
 *
 * @param validationToken one-time token delivered to the proposed new email.
 * @returns the email address that is now primary.
 * @throws rejects when the validation link is invalid, expired, or already used.
 */
export async function completeEmailChangeAsync(
    validationToken: string,
): Promise<EmailChangeResponse> {
    return xhrGetAsync<EmailChangeResponse>(
        `${usersUrl}/email-change/verify?token=${encodeURIComponent(validationToken)}`,
    )
}

/**
 * Extracts a user-facing message from an email-change API error.
 *
 * @param error unknown error caught from an API request.
 * @param fallback message used when the response has no useful detail.
 * @returns a concise user-facing error message.
 */
export function getEmailChangeErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof AxiosError)) {
        return error instanceof Error && error.message ? error.message : fallback
    }

    const responseMessage: unknown = error.response?.data?.message
        ?? error.response?.data?.error?.message

    if (Array.isArray(responseMessage)) {
        return responseMessage.join(' ')
    }

    return typeof responseMessage === 'string' && responseMessage.trim()
        ? responseMessage
        : (error.message || fallback)
}
