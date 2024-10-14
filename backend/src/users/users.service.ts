import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';

@Injectable()
export class UsersService {
  private users: { [key: string]: string } = {};

  constructor() {
    dotenv.config();
    const usersEnv = process.env.USERS || '';
    usersEnv.split(' ').forEach((userPair) => {
      const [username, password] = userPair.split(':');
      if (username && password) {
        this.users[username] = password;
      }
    });
    console.log('Loaded users:', Object.keys(this.users));
  }

  validateUser(username: string, password: string): boolean {
    console.log('Validating user:', username);
    return this.users[username] && this.users[username] === password;
  }
}
