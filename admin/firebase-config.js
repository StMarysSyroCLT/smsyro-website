window.churchAdminFirebase = {
  enabled: true,
  allowlistCollection: "adminAllowlist",
  config: {
    apiKey: "AIzaSyDKgt3GrYUdtcKT5x4mKaCKDQpXrMYyZdM",
    authDomain: "stmarys-admin.firebaseapp.com",
    projectId: "stmarys-admin",
    storageBucket: "stmarys-admin.firebasestorage.app",
    messagingSenderId: "999665038355",
    appId: "1:999665038355:web:e4d50690dc47f544887be6"
  }
};

if (window.firebase) {
  const app = window.firebase.apps.length
    ? window.firebase.app()
    : window.firebase.initializeApp(window.churchAdminFirebase.config);
  const auth = window.firebase.auth(app);
  const db = window.firebase.firestore(app);
  const googleProvider = new window.firebase.auth.GoogleAuthProvider();

  db.settings({
    experimentalAutoDetectLongPolling: true,
    merge: true
  });

  googleProvider.setCustomParameters({
    prompt: "select_account"
  });

  async function isAllowedUser(user) {
    const email = user?.email?.toLowerCase();

    if (!email) {
      return false;
    }

    let snapshot;

    try {
      snapshot = await db
        .collection(window.churchAdminFirebase.allowlistCollection)
        .doc(email)
        .get();
    } catch (error) {
      throw error;
    }

    const data = snapshot.exists ? snapshot.data() : null;

    return Boolean(snapshot.exists && data?.enabled === true);
  }

  async function requireAllowedUser(user) {
    if (!(await isAllowedUser(user))) {
      await auth.signOut();
      throw new Error("This Google account is not allowed to access admin.");
    }

    return user;
  }

  window.churchAdminAuthProvider = {
    async signIn() {
      const result = await auth.signInWithPopup(googleProvider);
      return requireAllowedUser(result.user);
    },
    async signOut() {
      await auth.signOut();
    },
    async getCurrentUser() {
      const user = await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
          unsubscribe();
          resolve(currentUser);
        });
      });

      if (!user) {
        return null;
      }

      try {
        return await requireAllowedUser(user);
      } catch {
        return null;
      }
    }
  };
} else {
  window.churchAdminAuthProvider = null;
}
