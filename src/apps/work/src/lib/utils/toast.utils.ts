import { toast, ToastOptions } from 'react-toastify'

const DEFAULT_TOAST_OPTIONS: ToastOptions = {
    autoClose: 3000,
    position: 'top-right',
}

export function showSuccessToast(message: string): void {
    toast.success(message, DEFAULT_TOAST_OPTIONS)
}

export function showErrorToast(message: string): void {
    toast.error(message, DEFAULT_TOAST_OPTIONS)
}

export function showInfoToast(message: string): void {
    toast.info(message, DEFAULT_TOAST_OPTIONS)
}
