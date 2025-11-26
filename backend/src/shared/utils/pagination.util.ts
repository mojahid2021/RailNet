/**
 * Pagination Utility
 * 
 * Helper functions for pagination
 */

import { PAGINATION } from '../../common/constants';
import { PaginationParams, PaginationMeta } from '../../common/types';

export class PaginationUtil {
  static getParams(query: any): Required<PaginationParams> {
    const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT)
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static getMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
