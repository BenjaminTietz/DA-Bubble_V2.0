export class Reaction {
  reactionId: string;
  user: string[];
  messageId: string;
  amount: number;
  nativeEmoji: string;

  constructor(obj?: any) {
    this.reactionId = obj ? obj.id : '';
    this.user = obj ? obj.users : [];
    this.messageId = obj ? obj.messageId : '';
    this.amount = obj ? obj.amount : 0;
    this.nativeEmoji = obj ? obj.emoji : '';
  }
}
