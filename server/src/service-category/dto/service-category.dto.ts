import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty({ type: String, required: true, example: 'Home Cleaning' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @ApiProperty({ type: String, required: false, example: 'Professional home cleaning services' })
  description?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
  @ApiProperty({ type: String, required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  parentId?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
