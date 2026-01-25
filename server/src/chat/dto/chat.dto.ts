import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty({ message: 'Provider ID is required' })
  @IsUUID('4', { message: 'Provider ID must be a valid UUID' })
  @ApiProperty({ type: String, required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  providerId: string;
}

export class SendMessageDto {
  @IsNotEmpty({ message: 'Chat ID is required' })
  @IsUUID('4', { message: 'Chat ID must be a valid UUID' })
  @ApiProperty({ type: String, required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  chatId: string;

  @IsNotEmpty({ message: 'Content is required' })
  @IsString({ message: 'Content must be a string' })
  @ApiProperty({ type: String, required: true, example: 'Hello, how are you?' })
  content: string;
}
