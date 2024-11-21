import { Injectable } from '@nestjs/common';

@Injectable()
export class ThirdPartyService {
  getHello(): string {
    return 'Hello World!';
  }
}
