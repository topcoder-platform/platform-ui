/**
 * Determines whether a collapsed profile bio contains hidden content.
 *
 * Used by the member profile page after its five-line CSS clamp is applied so
 * the See More control is shown only when the rendered bio actually overflows.
 *
 * @param {Pick<HTMLElement, 'clientHeight' | 'scrollHeight'>} element - The rendered bio element.
 * @returns {boolean} True when some rendered bio content is hidden by the clamp.
 * @throws This function does not raise exceptions.
 */
export const isBioOverflowing = (
    element: Pick<HTMLElement, 'clientHeight' | 'scrollHeight'>,
): boolean => element.scrollHeight > element.clientHeight
