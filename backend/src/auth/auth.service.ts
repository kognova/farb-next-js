import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  validateUser(username: string, password: string): boolean {
    return this.usersService.validateUser(username, password);
  }
}
