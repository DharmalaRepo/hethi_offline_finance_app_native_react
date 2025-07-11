
export const normalizeText = (text: string): string =>
  text.toLowerCase().replace(/[^\w\s]/gi, '').trim();