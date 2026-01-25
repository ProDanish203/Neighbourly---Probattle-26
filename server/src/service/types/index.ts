import { PaginationInfo, QueryParams } from 'src/common/types';
import { ServiceSelect } from '../queries';

export interface GetNearbyServicesResponse {
  services: ServiceSelect[];
  searchMetadata: {
    userLocation: {
      latitude: number;
      longitude: number;
    };
    radiusKm: number;
    algorithm: 'Haversine';
  };
  pagination: PaginationInfo;
}

export interface GetServiceByIdResponse {
  service: ServiceSelect;
}

export interface ServiceQueryParams extends QueryParams {
  categoryId?: string;
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  radius?: number;
}

export interface GetMyServicesResponse {
  services: ServiceSelect[];
  pagination: PaginationInfo;
}
