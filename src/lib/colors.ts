export type RGBA = { r: number; g: number; b: number; a?: number }


export const COLORS = {
drivers: { r: 220, g: 38, b: 38 }, // red
walkers: { r: 34, g: 197, b: 94 }, // green
train: { r: 37, g: 99, b: 235 }, // blue
bike: { r: 168, g: 85, b: 247 }, // purple
}


export function blend(weights: { drivers: number; walkers: number; train: number; bike: number }) {
const w = weights
const sum = w.drivers + w.walkers + w.train + w.bike || 1
const r = (COLORS.drivers.r * w.drivers + COLORS.walkers.r * w.walkers + COLORS.train.r * w.train + COLORS.bike.r * w.bike) / sum
const g = (COLORS.drivers.g * w.drivers + COLORS.walkers.g * w.walkers + COLORS.train.g * w.train + COLORS.bike.g * w.bike) / sum
const b = (COLORS.drivers.b * w.drivers + COLORS.walkers.b * w.walkers + COLORS.train.b * w.train + COLORS.bike.b * w.bike) / sum
return `rgb(${r|0}, ${g|0}, ${b|0})`
}