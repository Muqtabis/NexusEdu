import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async chat(userMessage: string, role: string = 'student') {
    return { reply: "AI is currently sleeping haha. (Service not fully configured yet)" };
  }
}