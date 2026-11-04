import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export interface Credentials {
  email: string;
  password: string;
}

@Injectable()
export class CredentialsPipe implements PipeTransform<unknown, Credentials> {
  transform(value: unknown): Credentials {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Email and password are required');
    }
    const { email, password } = value as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestException('Email and password must be strings');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (
      normalizedEmail.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      throw new BadRequestException('A valid email is required');
    }
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException(
        'Password must have at least 8 characters and at most 72 UTF-8 bytes',
      );
    }
    return { email: normalizedEmail, password };
  }
}
