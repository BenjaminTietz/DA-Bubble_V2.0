export class PrivateNote {
  privateNoteId: string;
  privateNoteCreator: string;

  constructor(obj?: any) {
    this.privateNoteId = obj ? obj.id : '';
    this.privateNoteCreator = obj ? obj.privateNote : '';
  }
}
