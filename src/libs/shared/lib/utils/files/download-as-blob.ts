export function downloadBlob(content: Blob, fileName: string): void {
    // create a tag to downlad file.
    const link: HTMLAnchorElement = document.createElement('a')
    link.setAttribute('href', window.URL.createObjectURL(content))
    link.setAttribute('download', fileName)
    document.body.appendChild(link) // Required for FF

    link.click()
    link.remove()
}
