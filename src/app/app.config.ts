import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

const firebaseConfig = {
  projectId: 'da-bubble-b7d76',
  appId: '1:829050807456:web:c04f2d844cab035f4f55c5',
  storageBucket: 'da-bubble-b7d76.appspot.com',
  apiKey: 'AIzaSyDlnzbLdBSdYINIBM1v4OcfHW2Pr-LPBH4',
  authDomain: 'da-bubble-b7d76.firebaseapp.com',
  messagingSenderId: '829050807456',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAnimations(),
    provideHttpClient(),
  ],
};
