import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { User } from '@db';
import { ApiResponse, MulterFile, QueryParams } from 'src/common/types';
import { throwError } from 'src/common/utils/helpers';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/service-category.dto';
import { serviceCategorySelect, ServiceCategorySelect } from './queries';
import { GetAllServiceCategoryResponse, GetAllParentsResponse, GetByParentResponse } from './types';
import { Prisma } from '@db';

@Injectable()
export class ServiceCategoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async populateCategoryImages(category: ServiceCategorySelect): Promise<ServiceCategorySelect> {
    return {
      ...category,
      image: category.image ? this.storageService.getImageUrl(category.image) : null,
    };
  }

  async getAllCategories(query?: QueryParams): Promise<ApiResponse<GetAllServiceCategoryResponse>> {
    try {
      const { page = 1, limit = 20 } = query || {};

      const [categories, totalCount] = await Promise.all([
        this.prismaService.serviceCategory.findMany({
          select: serviceCategorySelect,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        this.prismaService.serviceCategory.count(),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      const categoriesWithImages = await Promise.all(
        categories.map((category) => this.populateCategoryImages(category)),
      );

      return {
        message: 'Categories retrieved successfully',
        success: true,
        data: {
          categories: categoriesWithImages,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
          },
        },
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to retrieve categories', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createCategory(
    user: User,
    createCategoryDto: CreateCategoryDto,
    image?: MulterFile,
  ): Promise<ApiResponse<ServiceCategorySelect>> {
    try {
      const { name, description, parentId } = createCategoryDto;

      const [parent, existingCategory] = await Promise.all([
        parentId
          ? this.prismaService.serviceCategory.findUnique({
              where: { id: parentId },
            })
          : Promise.resolve(null),
        this.prismaService.serviceCategory.findFirst({
          where: {
            name: {
              equals: name,
              mode: 'insensitive',
            },
            parentId: parentId || null,
          },
        }),
      ]);

      if (parentId && !parent) throw throwError('Parent category not found', HttpStatus.NOT_FOUND);

      if (existingCategory) throw throwError('Category with this name already exists', HttpStatus.BAD_REQUEST);

      let imageFilename: string | null = null;
      if (image) {
        const uploadResult = await this.storageService.uploadFile(image);
        imageFilename = uploadResult.filename;
      }

      const category = await this.prismaService.serviceCategory.create({
        data: {
          name,
          description,
          parentId: parentId || null,
          image: imageFilename,
        },
        select: serviceCategorySelect,
      });

      const categoryWithImage = await this.populateCategoryImages(category);

      return {
        message: 'Category created successfully',
        success: true,
        data: categoryWithImage,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to create category', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateCategory(
    user: User,
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    image?: MulterFile,
  ): Promise<ApiResponse<ServiceCategorySelect>> {
    try {
      const category = await this.prismaService.serviceCategory.findUnique({
        where: { id },
      });

      if (!category) throw throwError('Category not found', HttpStatus.NOT_FOUND);

      const { name, description, parentId } = updateCategoryDto;

      if (parentId === id) throw throwError('Category cannot be its own parent', HttpStatus.BAD_REQUEST);

      const [parent, existingCategory] = await Promise.all([
        parentId
          ? this.prismaService.serviceCategory.findUnique({
              where: { id: parentId },
            })
          : Promise.resolve(null),
        name
          ? this.prismaService.serviceCategory.findFirst({
              where: {
                name: {
                  equals: name,
                  mode: 'insensitive',
                },
                parentId: parentId !== undefined ? parentId || null : category.parentId,
                id: {
                  not: id,
                },
              },
            })
          : Promise.resolve(null),
      ]);

      if (parentId && !parent) throw throwError('Parent category not found', HttpStatus.NOT_FOUND);
      if (existingCategory) throw throwError('Category with this name already exists', HttpStatus.BAD_REQUEST);

      let imageFilename: string | undefined = undefined;
      if (image) {
        const [uploadResult] = await Promise.all([
          this.storageService.uploadFile(image),
          category.image ? this.storageService.removeFile(category.image) : Promise.resolve(),
        ]);
        imageFilename = uploadResult.filename;
      }

      const updateData: Prisma.ServiceCategoryUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (parentId !== undefined) {
        if (parentId) {
          updateData.parent = { connect: { id: parentId } };
        } else {
          updateData.parent = { disconnect: true };
        }
      }
      if (imageFilename !== undefined) updateData.image = imageFilename;

      const updatedCategory = await this.prismaService.serviceCategory.update({
        where: { id },
        data: updateData,
        select: serviceCategorySelect,
      });

      const categoryWithImage = await this.populateCategoryImages(updatedCategory);

      return {
        message: 'Category updated successfully',
        success: true,
        data: categoryWithImage,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to update category', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteCategory(user: User, id: string): Promise<ApiResponse<void>> {
    try {
      const category = await this.prismaService.serviceCategory.findUnique({
        where: { id },
        include: {
          children: true,
          services: true,
        },
      });

      if (!category) throw throwError('Category not found', HttpStatus.NOT_FOUND);

      if (category.children.length > 0)
        throw throwError('Cannot delete category with child categories', HttpStatus.BAD_REQUEST);

      if (category.services.length > 0)
        throw throwError('Cannot delete category with associated services', HttpStatus.BAD_REQUEST);

      if (category.image) await this.storageService.removeFile(category.image);

      await this.prismaService.serviceCategory.delete({
        where: { id },
      });

      return {
        message: 'Category deleted successfully',
        success: true,
      };
    } catch (err) {
      throw throwError(err.message || 'Failed to delete category', err.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllParents(query?: QueryParams): Promise<ApiResponse<GetAllParentsResponse>> {
    try {
      const { page = 1, limit = 20 } = query || {};

      const where: Prisma.ServiceCategoryWhereInput = {
        parentId: null,
      };

      const [categories, totalCount] = await Promise.all([
        this.prismaService.serviceCategory.findMany({
          where,
          select: serviceCategorySelect,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        this.prismaService.serviceCategory.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / Number(limit));

      const categoriesWithImages = await Promise.all(
        categories.map((category) => this.populateCategoryImages(category)),
      );

      return {
        message: 'Parent categories retrieved successfully',
        success: true,
        data: {
          categories: categoriesWithImages,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
          },
        },
      };
    } catch (err) {
      throw throwError(
        err.message || 'Failed to retrieve parent categories',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getByParent(parentId: string, query?: QueryParams): Promise<ApiResponse<GetByParentResponse>> {
    try {
      const { page = 1, limit = 20 } = query || {};

      const where: Prisma.ServiceCategoryWhereInput = {
        parentId,
      };

      const [parent, categories, totalCount] = await Promise.all([
        this.prismaService.serviceCategory.findUnique({
          where: { id: parentId },
        }),
        this.prismaService.serviceCategory.findMany({
          where,
          select: serviceCategorySelect,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        this.prismaService.serviceCategory.count({ where }),
      ]);

      if (!parent) throw throwError('Parent category not found', HttpStatus.NOT_FOUND);

      const totalPages = Math.ceil(totalCount / Number(limit));

      const categoriesWithImages = await Promise.all(
        categories.map((category) => this.populateCategoryImages(category)),
      );

      return {
        message: 'Categories retrieved successfully',
        success: true,
        data: {
          categories: categoriesWithImages,
          pagination: {
            totalCount,
            totalPages,
            page: Number(page),
            limit: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPrevPage: Number(page) > 1,
          },
        },
      };
    } catch (err) {
      throw throwError(
        err.message || 'Failed to retrieve categories by parent',
        err.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
