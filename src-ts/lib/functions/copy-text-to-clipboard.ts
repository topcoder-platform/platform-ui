export async function copyTextToClipboard(text: string): Promise<void> {
    try {
        return await navigator.clipboard.writeText(text)
    } catch (error) {}

    const activeElement: typeof document.activeElement = document.activeElement
    const textArea: HTMLTextAreaElement = document.createElement('textarea')

    document.body.appendChild(textArea)

    textArea.style.height = '1px'
    textArea.style.width = '1px'
    textArea.style.position = 'absolute'

    textArea.value = text
    textArea.focus()
    textArea.select()

    document.execCommand('copy')

    if (activeElement instanceof HTMLElement) {
        activeElement.focus()
    }

    document.body.removeChild(textArea)

    return undefined
}
