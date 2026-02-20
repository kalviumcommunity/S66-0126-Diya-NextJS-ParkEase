import xss from 'xss';

const DEFAULT_OPTIONS: any = {};

export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return xss(input, {
    whiteList: DEFAULT_OPTIONS,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
  }).trim();
}
