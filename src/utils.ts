export const getId = <T extends { id: number }>(doc: T | number): number => {
  return typeof doc === 'number' ? doc : doc.id
}
