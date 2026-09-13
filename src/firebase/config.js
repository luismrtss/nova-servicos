import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAU5_rTzQoY84cmHByBiYOdkDXw-8lYGDk",
  authDomain: "nova-servicos.firebaseapp.com",
  projectId: "nova-servicos",
  storageBucket: "nova-servicos.firebasestorage.app",
  messagingSenderId: "531060751506",
  appId: "1:531060751506:web:5a7a36e1805e6f68ee3a4b",
  measurementId: "G-B1T3Q6RL6E",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)