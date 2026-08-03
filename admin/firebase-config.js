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
  const debugAuth = true;

  db.settings({
    experimentalAutoDetectLongPolling: true,
    merge: true
  });

  function logAuth(message, details = {}) {
    if (!debugAuth) {
      return;
    }

    console.info("[church-admin-auth]", message, details);
  }

  googleProvider.setCustomParameters({
    prompt: "select_account"
  });

  async function isAllowedUser(user) {
    const email = user?.email?.toLowerCase();

    if (!email) {
      logAuth("No email found on signed-in user.");
      return false;
    }

    logAuth("Checking Firestore allowlist.", {
      collection: window.churchAdminFirebase.allowlistCollection,
      email
    });

    let snapshot;

    try {
      snapshot = await db
        .collection(window.churchAdminFirebase.allowlistCollection)
        .doc(email)
        .get();
    } catch (error) {
      console.error("[church-admin-auth] Firestore allowlist read failed.", {
        email,
        code: error.code,
        message: error.message
      });
      throw error;
    }

    const data = snapshot.exists ? snapshot.data() : null;
    const allowed = Boolean(snapshot.exists && data?.enabled === true);

    logAuth("Allowlist check complete.", {
      email,
      exists: snapshot.exists,
      enabled: data?.enabled,
      allowed
    });

    return allowed;
  }

  async function requireAllowedUser(user) {
    logAuth("Validating signed-in user.", {
      email: user?.email || null
    });

    if (!(await isAllowedUser(user))) {
      logAuth("User rejected by allowlist.", {
        email: user?.email || null
      });
      await auth.signOut();
      throw new Error("This Google account is not allowed to access admin.");
    }

    logAuth("User approved by allowlist.", {
      email: user.email
    });

    return user;
  }

  window.churchAdminAuthProvider = {
    async signIn() {
      logAuth("Opening Google sign-in popup.");
      const result = await auth.signInWithPopup(googleProvider);
      logAuth("Google sign-in completed.", {
        email: result.user?.email || null
      });
      return requireAllowedUser(result.user);
    },
    async signOut() {
      logAuth("Signing out.");
      await auth.signOut();
    },
    async getCurrentUser() {
      logAuth("Waiting for current Firebase Auth state.");
      const user = await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
          unsubscribe();
          resolve(currentUser);
        });
      });

      if (!user) {
        logAuth("No active Firebase Auth user.");
        return null;
      }

      try {
        return await requireAllowedUser(user);
      } catch {
        logAuth("Active Firebase Auth user failed allowlist validation.");
        return null;
      }
    }
  };
} else {
  console.warn("[church-admin-auth] Firebase SDK was not loaded.");
  window.churchAdminAuthProvider = null;
}
