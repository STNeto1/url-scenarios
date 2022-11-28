export const parseQueryParams = (raw: string): Record<string, string> => {
  const [_, tail] = raw.split('?')
  const params = new URLSearchParams(tail)

  return Object.fromEntries(params)
}
