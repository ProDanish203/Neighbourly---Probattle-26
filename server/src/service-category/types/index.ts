import { PaginationInfo } from 'src/common/types';
import { ServiceCategorySelect } from '../queries';

export interface GetAllServiceCategoryResponse {
  categories: ServiceCategorySelect[];
  pagination: PaginationInfo;
}

export interface GetAllParentsResponse {
  categories: ServiceCategorySelect[];
  pagination: PaginationInfo;
}

export interface GetByParentResponse {
  categories: ServiceCategorySelect[];
  pagination: PaginationInfo;
}
