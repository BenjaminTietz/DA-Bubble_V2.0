import { User } from './user.class';
import { Message } from './message.class';

export class PrivateChat {
  privatChatId: string;
  chatCreator: string;
  chatReciver: string;

  constructor(obj?: any) {
    this.privatChatId = obj ? obj.id : '';
    this.chatCreator = obj ? obj.chatCreator : '';
    this.chatReciver = obj ? obj.chatReciver : '';
  }
}
