import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, Min, IsBoolean } from 'class-validator';

export class CreateServiceDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @ApiProperty({ type: String, required: true, example: 'Professional Home Cleaning' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @ApiProperty({ type: String, required: false, example: 'Thorough cleaning service for your home' })
  description?: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be at least 0' })
  @ApiProperty({ type: Number, required: true, example: 50.0 })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(1, { message: 'Duration must be at least 1' })
  @ApiProperty({ type: Number, required: false, example: 120 })
  duration?: number;

  @IsNotEmpty({ message: 'Category ID is required' })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  @ApiProperty({ type: String, required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @ApiProperty({ type: String, required: false, example: '123 Main Street, City, State' })
  address?: string;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @IsOptional()
  @ApiProperty({ type: Boolean, required: false, example: true })
  @IsBoolean({ message: 'Is active must be a boolean' })
  @Transform(({ value }) => value === 'true')
  isActive?: boolean;
}
