importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAm4xKW8QLwPK_zXqCCBKxQHKhBwPY3yTk",
  authDomain: "condo-facil-bdb1e.firebaseapp.com",
  projectId: "condo-facil-bdb1e",
  storageBucket: "condo-facil-bdb1e.firebasestorage.app",
  messagingSenderId: "87856268982",
  appId: "1:87856268982:web:5eddae0101ffd0feff8817",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/vite.svg",
  });
});