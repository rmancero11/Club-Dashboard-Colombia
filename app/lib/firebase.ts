import { FirebaseApp, initializeApp } from 'firebase/app'
import { Firestore, getFirestore, Timestamp } from 'firebase/firestore'
import { Auth, getAuth } from 'firebase/auth'

let db: Firestore | null = null
let firebaseApp: FirebaseApp | undefined
export let auth: Auth

export const getFirebase = () => {
  if (!db) {
    if (!firebaseApp) {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_VITE_APP_GOOGLE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_VITE_APP_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_VITE_APP_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_VITE_APP_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_VITE_APP_MESSSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_VITE_APP_APP_ID
      }

      if (Object.values(firebaseConfig).some(val => val === undefined || val === null)) {
        throw new Error('Falta alguna configuración de Firebase.')
      }

      firebaseApp = initializeApp(firebaseConfig)
      auth = getAuth(firebaseApp)
    }

    db = getFirestore(firebaseApp)
  }

  return { db, firebaseApp, auth }
}

export const getTimesTampFromDate = (date: Date) => {
  return Timestamp.fromDate(date)
}
