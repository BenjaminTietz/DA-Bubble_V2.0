export class PrivateNote {
  privatNoteId: string;
  privateNoteCreator: string;

  constructor(obj?: any) {
    this.privatNoteId = obj ? obj.id : '';
    this.privateNoteCreator = obj ? obj.privateNote : '';
  }
}
