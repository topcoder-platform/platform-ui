export type PackedCircle = {
    id: string
    r: number
    x: number
    y: number
}

export type PackCirclesOptions = {
    fit?: 'contain' | 'width'
    padding?: number
}

function overlaps(
    a: PackedCircle,
    b: PackedCircle,
    padding: number,
): boolean {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const minDist = a.r + b.r + padding

    return (dx * dx) + (dy * dy) < minDist * minDist
}

function hashString(value: string): number {
    let hash = 0

    for (let i = 0; i < value.length; i += 1) {
        hash = ((hash * 31) + value.charCodeAt(i)) % 2147483647
    }

    return hash + 1
}

function createRng(seed: number): () => number {
    let state = (seed % 2147483646) + 1

    return () => {
        state = (state * 16807) % 2147483647
        return (state - 1) / 2147483646
    }
}

function shuffleItems<T>(items: T[], rng: () => number): T[] {
    const shuffled = [...items]

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1))
        const current = shuffled[i]
        shuffled[i] = shuffled[j]
        shuffled[j] = current
    }

    return shuffled
}

function resolveAspect(
    width: number,
    height: number,
    fit: PackCirclesOptions['fit'],
): number {
    if (fit === 'width') {
        // Portrait cloud: about two bubbles across, stacked long-ways.
        return 0.48
    }

    return Math.min(Math.max(width / Math.max(height, 1), 1), 2.15)
}

/**
 * Place circles in a tight non-overlapping cluster, then scale uniformly
 * so the pack fits the viewport. `fit: 'width'` keeps bubble size and lets
 * the pack grow tall so mobile can scroll the long way.
 */
export function packCircles(
    items: Array<{ id: string; r: number }>,
    width: number,
    height: number,
    options: PackCirclesOptions = {},
): PackedCircle[] {
    const padding = options.padding ?? 6
    const fit = options.fit ?? 'contain'
    const rng = createRng(items.reduce((seed, item) => seed + hashString(item.id), 1))
    const ordered = shuffleItems(items, rng)
    const placed: PackedCircle[] = []
    const aspect = resolveAspect(width, height, fit)
    const angleOffset = rng() * Math.PI * 2

    ordered.forEach(item => {
        if (placed.length === 0) {
            placed.push({
                id: item.id,
                r: item.r,
                x: 0,
                y: 0,
            })
            return
        }

        let found: PackedCircle | undefined
        const maxReach = placed.reduce(
            (reach, circle) => Math.max(
                reach,
                Math.hypot(circle.x / aspect, circle.y) + circle.r,
            ),
            0,
        ) + item.r + padding + 8

        for (let dist = item.r; dist <= maxReach && !found; dist += 3) {
            const steps = Math.max(16, Math.ceil((2 * Math.PI * dist) / 10))
            for (let step = 0; step < steps && !found; step += 1) {
                const angle = ((step / steps) * 2 * Math.PI) + angleOffset + (placed.length * 0.37)
                const candidate: PackedCircle = {
                    id: item.id,
                    r: item.r,
                    x: Math.cos(angle) * dist * aspect,
                    y: Math.sin(angle) * dist,
                }

                if (!placed.some(circle => overlaps(candidate, circle, padding))) {
                    found = candidate
                }
            }
        }

        placed.push(found || {
            id: item.id,
            r: item.r,
            x: (maxReach + item.r) * aspect,
            y: 0,
        })
    })

    if (!placed.length || width <= 0 || (fit === 'contain' && height <= 0)) {
        return placed
    }

    const minX = Math.min(...placed.map(circle => circle.x - circle.r))
    const maxX = Math.max(...placed.map(circle => circle.x + circle.r))
    const minY = Math.min(...placed.map(circle => circle.y - circle.r))
    const maxY = Math.max(...placed.map(circle => circle.y + circle.r))
    const packWidth = Math.max(maxX - minX, 1)
    const packHeight = Math.max(maxY - minY, 1)
    const inset = 16
    const availableWidth = Math.max(width - (inset * 2), 1)
    const availableHeight = Math.max(height - (inset * 2), 1)
    const scale = fit === 'width'
        ? Math.min(availableWidth / packWidth, 1.05)
        : Math.min(availableWidth / packWidth, availableHeight / packHeight)
    const scaledWidth = packWidth * scale
    const scaledHeight = packHeight * scale
    const offsetX = inset + ((availableWidth - scaledWidth) / 2)
    const offsetY = fit === 'width'
        ? inset
        : inset + ((availableHeight - scaledHeight) / 2)

    return placed.map(circle => ({
        id: circle.id,
        r: circle.r * scale,
        x: ((circle.x - minX) * scale) + offsetX,
        y: ((circle.y - minY) * scale) + offsetY,
    }))
}

export function packedBoundsHeight(circles: PackedCircle[], padding: number = 16): number {
    if (!circles.length) {
        return 0
    }

    return Math.max(...circles.map(circle => circle.y + circle.r)) + padding
}
