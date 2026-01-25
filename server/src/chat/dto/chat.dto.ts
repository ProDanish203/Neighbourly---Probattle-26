import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsUUID } from 'class-validator';

export class CreateChatDto {
  @IsNotEmpty({ message: 'Provider email is required' })
  @IsEmail({}, { message: 'Provider email must be a valid email address' })
  @ApiProperty({ type: String, required: true, example: 'provider@example.com' })
  providerEmail: string;
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
