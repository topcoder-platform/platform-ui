import { downloadBlob } from './download-as-blob'

export function downloadCanvasAsImage(
    canvas: HTMLCanvasElement,
    fileName: string,
    fileType: string = 'image/png',
): void {
    canvas.style.display = 'none'
    document.body.append(canvas)
    canvas.toBlob(blob => {
        if (blob) {
            downloadBlob(blob, fileName)
        }
    }, fileType)
}
