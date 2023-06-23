export function createFileFromCanvas(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(async blob => {
            if (!blob) {
                reject()
                return
            }

            resolve(
                new File([blob], fileName, { type: blob.type }),
            )
        })
    })
}
