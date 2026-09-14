import { packCircles, packedBoundsHeight } from './packCircles'

describe('packCircles', () => {
    const items = [
        { id: 'a', r: 50 },
        { id: 'b', r: 40 },
        { id: 'c', r: 36 },
        { id: 'd', r: 60 },
        { id: 'e', r: 32 },
        { id: 'f', r: 48 },
    ]

    it('fits a landscape pack inside the given viewport', () => {
        const packed = packCircles(items, 960, 560)
        const maxX = Math.max(...packed.map(circle => circle.x + circle.r))
        const maxY = Math.max(...packed.map(circle => circle.y + circle.r))

        expect(packed)
            .toHaveLength(items.length)
        expect(maxX)
            .toBeLessThanOrEqual(960)
        expect(maxY)
            .toBeLessThanOrEqual(560)
    })

    it('packs a tall portrait cloud when fitting to width', () => {
        const manyItems = Array.from({ length: 18 }, (_, index) => ({
            id: `item-${index}`,
            r: 36 + ((index % 5) * 8),
        }))
        const contained = packCircles(manyItems, 360, 640)
        const portrait = packCircles(manyItems, 360, 640, { fit: 'width' })
        const height = packedBoundsHeight(portrait)
        const maxX = Math.max(...portrait.map(circle => circle.x + circle.r))

        expect(maxX)
            .toBeLessThanOrEqual(360)
        expect(height)
            .toBeGreaterThan(packedBoundsHeight(contained))
        expect(height)
            .toBeGreaterThan(640)
    })
})
