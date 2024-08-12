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
  apiKey: 'AIzaSyC3NxCAa4evh5774cAZ37tEH4f-8naPxnc',
  authDomain: 'da-bubble-v2.firebaseapp.com',
  projectId: 'da-bubble-v2',
  storageBucket: 'da-bubble-v2.appspot.com',
  messagingSenderId: '885952936646',
  appId: '1:885952936646:web:88f1e87e6d7f6ace74f5c7',
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
