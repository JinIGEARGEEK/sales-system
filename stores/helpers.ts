export const nextId = <T extends { id: number }>(items: T[]): number => Math.max(0, ...items.map(item => item.id)) + 1
