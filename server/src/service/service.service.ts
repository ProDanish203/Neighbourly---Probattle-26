import { Prisma, User } from '@db';
import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { ApiResponse, MulterFile, QueryParams } from 'src/common/types';
import { throwError } from 'src/common/utils/helpers';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { serviceSelect, ServiceSelect } from './queries';
import { GetMyServicesResponse, GetNearbyServicesResponse, GetServiceByIdResponse, ServiceQueryParams } from './types';
import { MinimalUserSelect } from 'src/user/queries';
import { calculateHaversineDistance, validateCoordinates } from 'src/common/utils/geospatial.utils';
import { SERVICE_CONSTANTS } from 'src/common/lib/constants';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async populateUserImages(user: MinimalUserSelect): Promise<MinimalUserSelect> {
    return {
      ...user,
      avatar: user.avatar ? this.storageService.getImageUrl(user.avatar) : null,
    };
  }

  private async populateServiceImages(service: ServiceSelect): Promise<ServiceSelect> {
    const [providerWithImage] = await Promise.all([this.populateUserImages(service.provider)]);

    return {
      ...service,
      images: service.images.map((image) => this.storageService.getImageUrl(image)),
      provider: providerWithImage,
      category: service.category.image
        ? {
            ...service.category,
            image: this.storageService.getImageUrl(service.category.image),
          }
        : service.category,
    };
  }

  async getNearbyServices(user: User, query?: ServiceQueryParams): Promise<ApiResponse<GetNearbyServicesResponse>> {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        filter = '',
        sort = '',
        categoryId,
        price,
        minPrice,
        maxPrice,
        radius,
      } = query || {};

      const userProfile = await this.prismaService.userProfile.findUnique({
        where: { userId: user.id },
        select: { longitude: true, latitude: true },
      });

      if (!userProfile) throw throwError('User profile not found', HttpStatus.NOT_FOUND);
      if (!userProfile.longitude || !userProfile.latitude)
        throw throwError(
          'Please update your profile and add your location to get nearby services',
          HttpStatus.BAD_REQUEST,
        );

      const userLat = userProfile.latitude;
      const userLng = userProfile.longitude;

      if (!validateCoordinates(userLat, userLng)) {
        throw throwError('Invalid user location coordinates', HttpStatus.BAD_REQUEST);
      }

      const searchRadius = radius
        ? Math.min(
            Math.max(Number(radius), SERVICE_CONSTANTS.MIN_SEARCH_RADIUS_KM),
            SERVICE_CONSTANTS.MAX_SEARCH_RADIUS_KM,
          )
        : SERVICE_CONSTANTS.DEFAULT_SEARCH_RADIUS_KM;

      const where: Prisma.ServiceWhereInput = {
        isActive: true,
        // Exclude services where coordinates are null
        latitude: { not: null },
        longitude: { not: null },
      };

      // Apply search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Apply category filter
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Apply price filters
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = Number(minPrice);
        if (maxPrice !== undefined) where.price.lte = Number(maxPrice);
      }

      const allServices = await this.prismaService.service.findMany({
        where,
        select: { id: true, longitude: true, latitude: true },
      });

      const servicesWithDistance = allServices
        .map((service) => {
          const distance = calculateHaversineDistance(userLat, userLng, service.latitude!, service.longitude!);

          return {
            ...service,
            distance: Number(distance.toFixed(2)), // Round to 2 decimal places
          };
        })
        .filter((service) => service.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);

      const serviceIds = servicesWithDistance.map((service) => service.id);

      const [services, totalCount] = await Promise.all([
        this.prismaService.service.findMany({
          where: { id: { in: serviceIds } },
          select: serviceSelect,
        }),
        this.prismaService.service.count({ where: { id: { in: serviceIds } } }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      const servicesWithPopulatedData = await Promise.all(
        services.map((service) => this.populateServiceImages(service)),
      );

      return {
        message: 'Services retrieved successfully',
        success: true,
        data: {
          services: servicesWithPopulatedData,
          searchMetadata: {
            userLocation: {
              latitude: userLat,
              longitude: userLng,
            },
            radiusKm: searchRadius,
            algorithm: 'Haversine',
          },
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage,
            hasPrevPage,
          },
        },
      };
    } catch (err) {
      throw throwError(
        err.message || 'Failed to retrieve nearby services',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createService(
    user: User,
    createServiceDto: CreateServiceDto,
    images?: MulterFile[],
  ): Promise<ApiResponse<ServiceSelect>> {
    try {
      const { name, description, price, duration, categoryId, address } = createServiceDto;

      const [provider, userProfile] = await Promise.all([
        this.prismaService.user.findUnique({
          where: { id: user.id },
          select: { id: true, isEmailVerified: true },
        }),
        this.prismaService.userProfile.findUnique({
          where: { userId: user.id },
          select: { longitude: true, latitude: true, address: true },
        }),
      ]);

      if (!provider || !provider.isEmailVerified) throw throwError('Please verify your email to create a service', HttpStatus.BAD_REQUEST);
      if (!userProfile) throw throwError('Please complete your profile to create a service', HttpStatus.NOT_FOUND);
      if (!userProfile.longitude || !userProfile.latitude)
        throw throwError('Please update your profile and add your location to create a service', HttpStatus.BAD_REQUEST);

      const category = await this.prismaService.serviceCategory.findUnique({
        where: { id: categoryId },
      });

      if (!category) throw throwError('Category not found', HttpStatus.NOT_FOUND);

      if (!images || images.length === 0) throw throwError('At least one image is required', HttpStatus.BAD_REQUEST);

      const uploadResults = await Promise.all(images.map((image) => this.storageService.uploadFile(image)));
      const imageFilenames = uploadResults.map((result) => result.filename);

      const service = await this.prismaService.service.create({
        data: {
          name,
          description,
          price: Number(price),
          duration: duration ? Number(duration) : null,
          categoryId,
          providerId: user.id,
          address: address || userProfile.address || '',
          longitude: userProfile.longitude ? Number(userProfile.longitude) : null,
          latitude: userProfile.latitude ? Number(userProfile.latitude) : null,
          images: imageFilenames,
          isActive: true,
        },
        select: serviceSelect,
      });

      const serviceWithPopulatedData = await this.populateServiceImages(service);

      return {
        message: 'Service created successfully',
        success: true,
        data: serviceWithPopulatedData,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to create service', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateService(
    user: User,
    serviceId: string,
    updateServiceDto: UpdateServiceDto,
    images?: MulterFile[],
  ): Promise<ApiResponse<ServiceSelect>> {
    try {
      const existingService = await this.prismaService.service.findUnique({
        where: { id: serviceId },
        select: { id: true, providerId: true, images: true },
      });

      if (!existingService) throw throwError('Service not found', HttpStatus.NOT_FOUND);

      if (existingService.providerId !== user.id)
        throw throwError('You do not have permission to update this service', HttpStatus.FORBIDDEN);

      const { name, description, price, duration, categoryId, address, isActive } =
        updateServiceDto;

      if (categoryId) {
        const category = await this.prismaService.serviceCategory.findUnique({
          where: { id: categoryId },
        });
        if (!category) throw throwError('Category not found', HttpStatus.NOT_FOUND);
      }

      const updateData: Prisma.ServiceUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      if (duration !== undefined) updateData.duration = duration ? Number(duration) : null;
      if (categoryId !== undefined) {
        updateData.category = {
          connect: { id: categoryId },
        };
      }
      if (address !== undefined) updateData.address = address;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Handle image updates
      if (images && images.length > 0) {
        const uploadResults = await Promise.all(images.map((image) => this.storageService.uploadFile(image)));
        const newImageFilenames = uploadResults.map((result) => result.filename);

        if (existingService.images && existingService.images.length > 0) {
          await Promise.all(existingService.images.map((oldImage) => this.storageService.removeFile(oldImage)));
        }

        updateData.images = newImageFilenames;
      }

      const updatedService = await this.prismaService.service.update({
        where: { id: serviceId },
        data: updateData,
        select: serviceSelect,
      });

      const serviceWithPopulatedData = await this.populateServiceImages(updatedService);

      return {
        message: 'Service updated successfully',
        success: true,
        data: serviceWithPopulatedData,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to update service', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteService(user: User, serviceId: string): Promise<ApiResponse<void>> {
    try {
      const existingService = await this.prismaService.service.findUnique({
        where: { id: serviceId },
        select: { id: true, providerId: true, images: true },
      });

      if (!existingService) throw throwError('Service not found', HttpStatus.NOT_FOUND);

      if (existingService.providerId !== user.id) {
        throw throwError('You do not have permission to delete this service', HttpStatus.FORBIDDEN);
      }

      if (existingService.images && existingService.images.length > 0) {
        await Promise.all(existingService.images.map((image) => this.storageService.removeFile(image)));
      }

      await this.prismaService.service.delete({
        where: { id: serviceId },
      });

      return {
        message: 'Service deleted successfully',
        success: true,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to delete service', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getServiceById(serviceId: string): Promise<ApiResponse<GetServiceByIdResponse>> {
    try {
      const service = await this.prismaService.service.findUnique({
        where: { id: serviceId },
        select: serviceSelect,
      });

      if (!service) throw throwError('Service not found', HttpStatus.NOT_FOUND);

      const serviceWithPopulatedData = await this.populateServiceImages(service);

      return {
        message: 'Service retrieved successfully',
        success: true,
        data: {
          service: serviceWithPopulatedData,
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve service', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMyServices(user: User, query?: QueryParams): Promise<ApiResponse<GetMyServicesResponse>> {
    try {
      const { page = 1, limit = 20, search = '', filter = '', sort = '' } = query || {};

      const where: Prisma.ServiceWhereInput = {
        providerId: user.id,
      };
      const orderBy: Prisma.ServiceOrderByWithRelationInput = {};

      if (filter) orderBy[filter] = 'asc';
      if (sort) orderBy[sort] = 'desc';
      if (!filter && !sort) orderBy.createdAt = 'desc';

      const [services, totalCount] = await Promise.all([
        this.prismaService.service.findMany({
          where,
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          select: serviceSelect,
        }),
        this.prismaService.service.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));
      const hasNextPage = Number(page) < totalPages;
      const hasPrevPage = Number(page) > 1;

      const servicesWithPopulatedData = await Promise.all(services.map((service) => this.populateServiceImages(service)));
      
      return {
        message: 'My services retrieved successfully',
        success: true,
        data: {
          services: servicesWithPopulatedData,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage,
            hasPrevPage,
          },
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve my services', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
