
document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginButton = document.getElementById('btn-login');
    const registerButton = document.getElementById('btn-register');

    let pending = false;

    // ==========================================
    // PINDAH KE FORM REGISTRASI
    // ==========================================
    document.getElementById('link-to-register').addEventListener('click', () => {
        formLogin.style.display = 'none';
        formRegister.style.display = 'block';

        document.getElementById('form-title').textContent =
            'Mulai kisah barumu.';

        document.getElementById('form-subtitle').textContent =
            'Buat akun dan ambil langkah pertamamu.';

        document.getElementById('reg-email').focus();
    });

    // ==========================================
    // PINDAH KE FORM LOGIN
    // ==========================================
    document.getElementById('link-to-login').addEventListener('click', () => {
        formRegister.style.display = 'none';
        formLogin.style.display = 'block';

        document.getElementById('form-title').textContent =
            'Selamat datang, Petualang.';

        document.getElementById('form-subtitle').textContent =
            'Masuk dan lanjutkan kisahmu.';

        document.getElementById('login-email').focus();
    });

    // ==========================================
    // MEMERIKSA KARAKTER YANG SUDAH DIBUAT
    // ==========================================
    function sudahMembuatKarakter() {
        const rawPlayer = GameStorage.getItem('rpg_player');

        if (!rawPlayer) {
            return false;
        }

        const player = JSON.parse(rawPlayer);

        if (!player || typeof player !== 'object') {
            return false;
        }

        // Class Warga merupakan karakter awal
        // yang belum menyelesaikan pembuatan karakter.
        const heroClass = player.heroClass;

        if (
            typeof heroClass !== 'string' ||
            heroClass === 'Warga' ||
            heroClass.trim() === ''
        ) {
            return false;
        }

        return true;
    }

    // ==========================================
    // LOGIN DAN REGISTRASI MYSQL
    // ==========================================
    async function submit(register) {
        if (pending) return;

        pending = true;
        loginButton.disabled = true;
        registerButton.disabled = true;

        const prefix = register ? 'reg' : 'login';

        try {
            const email = document.getElementById(
                `${prefix}-email`
            ).value;

            const password = document.getElementById(
                `${prefix}-password`
            ).value;

            // Autentikasi melalui Electron + MySQL.
            await GameAuth.authenticate(
                email,
                password,
                register
            );

            // Periksa status karakter setelah login.
            const karakterSudahDibuat =
                sudahMembuatKarakter();

            // ==================================
            // ARAHKAN PEMAIN KE HALAMAN YANG TEPAT
            // ==================================
            if (register || !karakterSudahDibuat) {

                // Akun baru atau belum membuat karakter.
                window.location.href = '../Hero/hero.html';

            } else {

                // Karakter sudah dibuat.
                window.location.href = '../Utama/Index.html';

            }

        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: register
                    ? 'Pendaftaran gagal'
                    : 'Tidak dapat masuk',
                text: error.message,
                background: '#13201b',
                color: '#f2efe2',
                confirmButtonColor: '#537359'
            });

            pending = false;
            loginButton.disabled = false;
            registerButton.disabled = false;
        }
    }

    // ==========================================
    // EVENT FORM LOGIN
    // ==========================================
    formLogin.addEventListener('submit', event => {
        event.preventDefault();
        submit(false);
    });

    // ==========================================
    // EVENT FORM REGISTRASI
    // ==========================================
    formRegister.addEventListener('submit', event => {
        event.preventDefault();
        submit(true);
    });
});
