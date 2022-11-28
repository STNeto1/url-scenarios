import { paginationSchema } from '../modules/routes/url/schemas'
import { parseQueryParams } from './parse-query-params'

export const safePagination = (raw: string) => {
  const params = parseQueryParams(raw)

  const result = paginationSchema.safeParse(params)

  if (!result.success) {
    return {
      page: 1,
      limit: 10
    }
  }

  return result.data
}
