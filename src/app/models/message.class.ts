import { User } from './user.class';
import { MessageAnswer } from './messageAnswer.class';
import { Reaction } from './reaction.class';

export class Message {
  messageId: string;
  text: string;
  chatId: string;
  date: string;
  time: string;
  messageSendBy: string;
  reactions: Reaction[];
  threadId: string;
  answerCount: number;
  lastAnswer: string;
  editCount: number;
  lastEdit: string;
  storageData: string;
  taggedUser: string[];

  constructor(obj?: any) {
    this.messageId = obj ? obj.id : '';
    this.text = obj ? obj.text : '';
    this.chatId = obj ? obj.chatId : '';
    this.date = obj ? obj.date : '';
    this.time = obj ? obj.time : '';
    this.messageSendBy = obj ? obj.messageSendBy : '';
    this.reactions = obj ? obj.reactions : [];
    this.threadId = obj ? obj.threadId : '';
    this.answerCount = obj ? obj.answerCount : 0;
    this.lastAnswer = obj ? obj.lastAnswer : '';
    this.editCount = obj ? obj.editCount : 0;
    this.lastEdit = obj ? obj.lastEdit : '';
    this.storageData = obj ? obj.storageData : '';
    this.taggedUser = obj ? obj.taggedUser : [];
  }
}
