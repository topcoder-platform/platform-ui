export function fileDownloadBlob(content: Blob, fileName: string): void {
    // create a tag to downlad file.
    const link: HTMLAnchorElement = document.createElement('a')
    link.setAttribute('href', window.URL.createObjectURL(content))
    link.setAttribute('download', fileName)
    document.body.appendChild(link) // Required for FF

    link.click()
    link.remove()
}

export function fileDownloadCanvasAsImage(canvas: HTMLCanvasElement, fileName: string, fileType: string = 'image/png'): void {
    canvas.style.display = 'none'
    document.body.append(canvas)
    canvas.toBlob((blob) => {
        if (blob) {
            fileDownloadBlob(blob, fileName)
        }
    }, fileType)
}

export function fileCreateFromCanvas(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async (blob) => {
            if (!blob) {
                reject()
                return
            }
            resolve(
                new File([blob], fileName, {type: blob.type})
            )
        })
    })
}
