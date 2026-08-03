(function () {
  const config = window.churchAdminFirebase || { enabled: false };
  const authProvider = window.churchAdminAuthProvider;

  function getRedirectTarget() {
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect") || "new-announcement.html";
  }

  async function hasActiveSession() {
    if (config.enabled && authProvider?.getCurrentUser) {
      return Boolean(await authProvider.getCurrentUser());
    }

    return false;
  }

  function redirectToLogin() {
    const currentPage = window.location.pathname.split("/").pop() || "new-announcement.html";
    window.location.replace(`index.html?redirect=${encodeURIComponent(currentPage)}`);
  }

  function showAuthMessage(message) {
    const messageNode = document.querySelector("[data-auth-message]");

    if (messageNode) {
      messageNode.textContent = message;
    }
  }

  async function signIn() {
    if (config.enabled) {
      if (!authProvider?.signIn) {
        throw new Error("Firebase Auth is not initialized yet.");
      }

      await authProvider.signIn();
      return;
    }

    throw new Error("Firebase Auth is required for admin sign in.");
  }

  async function signOut() {
    if (config.enabled && authProvider?.signOut) {
      await authProvider.signOut();
    }

  }

  async function initLoginForm() {
    const form = document.querySelector("[data-login-form]");

    if (!form) {
      return;
    }

    if (await hasActiveSession()) {
      window.location.replace(getRedirectTarget());
      return;
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showAuthMessage("");

      try {
        await signIn();
        window.location.replace(getRedirectTarget());
      } catch (error) {
        showAuthMessage(error.message || "Sign in failed.");
      }
    });
  }

  function initSignOutLinks() {
    document.querySelectorAll("[data-sign-out]").forEach((link) => {
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        await signOut();
        window.location.replace(link.href);
      });
    });
  }

  async function guardProtectedPage() {
    if (!document.body.dataset.requiresAuth) {
      return;
    }

    if (!(await hasActiveSession())) {
      redirectToLogin();
    }
  }

  guardProtectedPage();
  initLoginForm();
  initSignOutLinks();
})();
