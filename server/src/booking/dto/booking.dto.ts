import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsEnum, Min, Max, IsUUID } from 'class-validator';
import { BookingStatus } from '@db';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'Service ID is required' })
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  @ApiProperty({ type: String, required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  serviceId: string;

  @IsNotEmpty({ message: 'Start date time is required' })
  @IsDateString({}, { message: 'Start date time must be a valid date string' })
  @ApiProperty({ type: String, required: true, example: '2024-01-15T10:00:00Z' })
  startDateTime: string;

  @IsNotEmpty({ message: 'End date time is required' })
  @IsDateString({}, { message: 'End date time must be a valid date string' })
  @ApiProperty({ type: String, required: true, example: '2024-01-15T12:00:00Z' })
  endDateTime: string;

  @IsNotEmpty({ message: 'Address is required' })
  @IsString({ message: 'Address must be a string' })
  @ApiProperty({ type: String, required: true, example: '123 Main Street, City, State' })
  address: string;
}

export class UpdateBookingStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(BookingStatus, { message: 'Status must be a valid BookingStatus enum value' })
  @ApiProperty({ type: String, enum: BookingStatus, required: true, example: BookingStatus.CONFIRMED })
  status: BookingStatus;
}

export class UpdateBookingDto {
  @IsOptional()
  @IsDateString({}, { message: 'Start date time must be a valid date string' })
  @ApiProperty({ type: String, required: false, example: '2024-01-15T10:00:00Z' })
  startDateTime?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date time must be a valid date string' })
  @ApiProperty({ type: String, required: false, example: '2024-01-15T12:00:00Z' })
  endDateTime?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Total price must be a number' })
  @Min(0, { message: 'Total price must be at least 0' })
  @ApiProperty({ type: Number, required: false, example: 150.5 })
  totalPrice?: number;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @ApiProperty({ type: String, required: false, example: '123 Main Street, City, State' })
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Rating must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  @ApiProperty({ type: Number, required: false, example: 4.5 })
  rating?: number;

  @IsOptional()
  @IsString({ message: 'Review must be a string' })
  @ApiProperty({ type: String, required: false, example: 'Great service, highly recommended!' })
  review?: string;

  @IsOptional()
  @IsString({ message: 'Cancelled reason must be a string' })
  @ApiProperty({ type: String, required: false, example: 'Service provider unavailable' })
  cancelledReason?: string;
}
