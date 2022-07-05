export function downloadBlobAsFile(content: Blob, fileName: string): void {
    // create a tag to downlad file.
    const link: HTMLAnchorElement = document.createElement('a')
    link.setAttribute('href', window.URL.createObjectURL(content))
    link.setAttribute('download', fileName)
    document.body.appendChild(link) // Required for FF

    link.click()
    link.remove()
}

export function downloadCanvasAsFile(canvas: HTMLCanvasElement, fileName: string): void {
    canvas.style.display = 'none'
    document.body.append(canvas)
    canvas.toBlob((blob) => {
        if (blob) {
            downloadBlobAsFile(blob, fileName)
        }
    }, 'image/png')
}

export function cavasToFileObject(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
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
