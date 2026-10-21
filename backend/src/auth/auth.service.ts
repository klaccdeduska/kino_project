import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../movies/movies.database';

interface UserRow extends RowDataPacket {
    id: number;
    email: string;
    password_hash: string;
}

@Injectable()
export class AuthService {
    async register(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            throw new BadRequestException('Email and password are required');
        }

        const [users] = await pool.execute<UserRow[]>(
            'SELECT id FROM users WHERE email = ?',
            [normalizedEmail],
        );

        if (users.length > 0) {
            throw new ConflictException('Email is already registered');
        }

        const passwordHash = await hash(password, 10);

        await pool.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            [normalizedEmail, passwordHash],
        );

        return { message: 'Account created' };
    }

    async login(email: string, password: string) {
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            throw new BadRequestException('Email and password are required');
        }

        const [users] = await pool.execute<UserRow[]>(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [normalizedEmail],
        );

        const user = users[0];
        if (!user || !(await compare(password, user.password_hash))) {
            throw new UnauthorizedException('Invalid email or password');
        }

        return { id: user.id, email: user.email };
    }
}