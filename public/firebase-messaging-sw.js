// Scripts for firebase and firebase-messaging
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
firebase.initializeApp({
    apiKey: "AIzaSyA4UGezVVyrVwaCYbOH83T3ZgUAO48f7XQ",
    authDomain: "map-pin-482309.firebaseapp.com",
    projectId: "map-pin-482309",
    storageBucket: "map-pin-482309.firebasestorage.app",
    messagingSenderId: "144161489680",
    appId: "1:144161489680:web:2d5ccca2658e731ce25b95"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/favicon.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
