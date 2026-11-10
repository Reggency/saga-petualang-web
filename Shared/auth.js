
(function (root) {
  "use strict";

  async function authenticate(
    emailInput,
    password,
    register = false
  ) {

    if (!root.sagaAuth) {
      throw new Error(
        "Login MySQL hanya tersedia melalui Electron."
      );
    }

    // Verifikasi akun langsung melalui backend MySQL.
    const result = register
      ? await root.sagaAuth.register(
          emailInput,
          password
        )
      : await root.sagaAuth.login(
          emailInput,
          password
        );

    const email = result.email;

    try {

      // Menyimpan identitas sesi untuk
      // kompatibilitas dengan GameStorage.
      root.sessionStorage.setItem(
        "rpg_account_id",
        email
      );

      root.sessionStorage.setItem(
        "rpg_current_player",
        email.split("@")[0].toUpperCase()
      );

      root.sessionStorage.removeItem(
        "rpg_class_prompt_shown"
      );

      // Mengaktifkan 4 slot karakter.
      // Untuk sementara progres tetap di localStorage.
      root.GameStorage.activate(email, {
        isNew: register,
        legacyAccounts: {}
      });

    } catch (error) {

      root.sessionStorage.removeItem(
        "rpg_account_id"
      );

      root.sessionStorage.removeItem(
        "rpg_current_player"
      );

      try {
        await root.sagaAuth.logout();
      } catch (_) {}

      throw error;
    }

    return email;
  }

  root.GameAuth = {
    authenticate
  };

})(window);
