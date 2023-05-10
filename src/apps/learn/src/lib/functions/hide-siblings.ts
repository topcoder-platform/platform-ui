export function hideSiblings(el: HTMLElement): void {
    [].forEach.call(el.parentElement?.children ?? [], (c: HTMLElement) => {
        if (c !== el) {
            Object.assign(c.style, { display: 'none' })
        }
    })
}
