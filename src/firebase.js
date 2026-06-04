import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAm4xKW8QLwPK_zXqCCBKxQHKhBwPY3yTk",
  authDomain: "condo-facil-bdb1e.firebaseapp.com",
  projectId: "condo-facil-bdb1e",
  storageBucket: "condo-facil-bdb1e.firebasestorage.app",
  messagingSenderId: "87856268982",
  appId: "1:87856268982:web:5eddae0101ffd0feff8817",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);

export async function solicitarPermissaoNotificacao() {
  try {
    const permission = await Notification.requestPermission();
    console.log("Permissão:", permission);
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    console.log("SW registrado:", registration);

    const token = await getToken(messaging, {
      vapidKey: "BE-eN8mneDwdTlz6YvzLcdmLNM5gYn-XdJNWqzMfdbQTeQ75uUAPVL3QuJzyMtpQLXd6uYV6KzuRjRT1KfrBaHo",
      serviceWorkerRegistration: registration,
    });

    console.log("Token FCM:", token);
    return token;
  } catch (err) {
    console.error("Erro FCM:", err);
    return null;
  }
}

export { onMessage };