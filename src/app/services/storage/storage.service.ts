import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { deleteObject, getStorage, ref, StorageReference, uploadBytes } from '@angular/fire/storage';
import { getDownloadURL } from 'firebase/storage';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  getFile(storageRef: StorageReference) {
    throw new Error('Method not implemented.');
  }
  storage = getStorage();
  profilePicturesRef = ref(this.storage, 'profilePictures');

  constructor(private http: HttpClient) {}

  /**
   * Retrieves the download URL for the given storage reference.
   * @param storageRef - The storage reference to get the download URL for.
   * @returns An observable that emits the download URL as a string.
   */
  getURL(storageRef: StorageReference): Observable<string> {
    const promise = getDownloadURL(storageRef);
    return from(promise);
  }

  /**
   * Uploads a file to the specified storage reference.
   * @param storageRef - The storage reference to upload the file to.
   * @param file - The file to be uploaded.
   * @returns An Observable that emits the upload progress and completion status.
   */
  uploadFile(storageRef: StorageReference, file: File) {
    const promise = uploadBytes(storageRef, file);
    return from(promise);
  }

  /**
   * Deletes a file from the storage.
   *
   * @param storageRef - The reference to the file in the storage.
   */
  deleteFile(storageRef: StorageReference) {
    deleteObject(storageRef)
      .then(() => {
        //console.log('File deleted successfully');
      })
      .catch((error) => {
        console.log('Error deleting file:', error);
      });
  }

  deleteFileByUrl(url: string) {
    const storageRef = ref(this.storage, url);
    this.deleteFile(storageRef);
  }

  /**
   * Downloads a file from the specified URL directly.
   *
   * @param url - The URL of the file to download.
   */
  downloadFromUrlDirectly(url: string) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = 'test';
      a.click();
      URL.revokeObjectURL(url);
    };
    xhr.open('GET', url);
    xhr.send();
  }

  /**
   * Checks if a file exists in the storage.
   * @param storageRef - The reference to the file in the storage.
   * @returns An Observable that emits a boolean value indicating whether the file exists or not.
   */
  checkIfFileExists(storageRef: StorageReference): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      getDownloadURL(storageRef).then(
        () => {
          observer.next(true);
          observer.complete();
        },
        () => {
          observer.next(false);
          observer.complete();
        },
      );
    });
  }
}
