/** Lets an attachment picker temporarily take keyboard focus above an application modal. */
export const UPLOAD_PICKER_EVENT = 'topcoder:upload-picker'

export function notifyUploadPicker(open: boolean): void {
    window.dispatchEvent(new CustomEvent<boolean>(UPLOAD_PICKER_EVENT, { detail: open }))
}
