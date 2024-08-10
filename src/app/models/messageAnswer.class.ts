import { User } from './user.class';
import { Reaction } from './reaction.class';

export class MessageAnswer {
  messageAnswerId: string;
  text: string;
  messageId: string;
  date: string;
  time: string;
  messageSendBy: string;
  reactions: Reaction[];
  editCount: number;
  lastEdit: string;
  storageData: string;
  taggedUser: string[];

  constructor(obj?: any) {
    this.messageAnswerId = obj ? obj.id : '';
    this.text = obj ? obj.text : '';
    this.messageId = obj ? obj.messageId : '';
    this.date = obj ? obj.date : '';
    this.time = obj ? obj.time : '';
    this.messageSendBy = obj ? obj.messageSendBy : '';
    this.reactions = obj ? obj.reactions : [];
    this.editCount = obj ? obj.editCount : 0;
    this.lastEdit = obj ? obj.lastEdit : '';
    this.storageData = obj ? obj.storageData : '';
    this.taggedUser = obj ? obj.taggedUser : [];
  }
}
