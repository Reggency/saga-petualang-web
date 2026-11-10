
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginButton = document.getElementById('btn-login');
    const registerButton = document.getElementById('btn-register');

    const title = document.getElementById('form-title');
    const subtitle = document.getElementById('form-subtitle');

    let pending = false;

    // ==========================================
    // CEK MODE WEBSITE ATAU ELECTRON
    // ==========================================
    const isWebsite = (
        window.location.protocol === 'https:' ||
        window.location.protocol === 'http:'
    ) && !window.sagaAuth;

    // ==========================================
    // CEK KARAKTER SUDAH DIBUAT
    // ==========================================
    function sudahMembuatKarakter() {
        const rawPlayer = GameStorage.getItem('rpg_player');

        if (!rawPlayer) return false;

        try {
            const player = JSON.parse(rawPlayer);

            if (!player || typeof player !== 'object') {
                return false;
            }

            const heroClass = player.heroClass;

            return (
                typeof heroClass === 'string' &&
                heroClass.trim() !== '' &&
                heroClass !== 'Warga'
            );

        } catch (error) {
            console.error('Gagal membaca karakter:', error);
            return false;
        }
    }

    // ==========================================
    // ARAHKAN KE HALAMAN GAME
    // ==========================================
    function masukKeGame() {
        if (sudahMembuatKarakter()) {
            window.location.href = '../Utama/Index.html';
        } else {
            window.location.href = '../Hero/hero.html';
        }
    }

    // ==========================================
    // PINDAH KE FORM REGISTER
    // ==========================================
    document.getElementById('link-to-register')
        .addEventListener('click', () => {

            formLogin.style.display = 'none';
            formRegister.style.display = 'block';

            title.textContent = 'Mulai kisah barumu.';
            subtitle.textContent =
                'Buat akun dan ambil langkah pertamamu.';

            document.getElementById('reg-email').focus();
        });

    // ==========================================
    // PINDAH KE FORM LOGIN
    // ==========================================
    document.getElementById('link-to-login')
        .addEventListener('click', () => {

            formRegister.style.display = 'none';
            formLogin.style.display = 'block';

            title.textContent = 'Selamat datang, Petualang.';
            subtitle.textContent =
                'Masuk dan lanjutkan kisahmu.';

            document.getElementById('login-email').focus();
        });

    // ==========================================
    // LOGIN DAN REGISTRASI MYSQL ELECTRON
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

            await GameAuth.authenticate(
                email,
                password,
                register
            );

            if (register) {
                window.location.href = '../Hero/hero.html';
            } else {
                masukKeGame();
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

    formLogin.addEventListener('submit', event => {
        event.preventDefault();
        submit(false);
    });

    formRegister.addEventListener('submit', event => {
        event.preventDefault();
        submit(true);
    });

    // ==========================================
    // MODE DEMO KHUSUS WEBSITE / IPHONE
    // ==========================================
    if (isWebsite) {

        // Sembunyikan login MySQL di browser.
        formLogin.style.display = 'none';
        formRegister.style.display = 'none';

        title.textContent = 'SAGA PETUALANG';
        subtitle.textContent =
            'Jelajahi dunia petualangan dalam Mode Demo.';

        // Membuat tombol demo otomatis.
        const demoButton = document.createElement('button');

        demoButton.type = 'button';
        demoButton.id = 'btn-demo';
        demoButton.textContent = '⚔️ MAIN MODE DEMO';

        // Tampilan tombol.
        Object.assign(demoButton.style, {
            display: 'block',
            width: '100%',
            padding: '16px 20px',
            marginTop: '20px',
            border: '1px solid #d8b66d',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8b642d, #49341b)',
            color: '#fff0c5',
            fontFamily: 'inherit',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '1px',
            cursor: 'pointer'
        });

        formRegister.insertAdjacentElement(
            'afterend',
            demoButton
        );

        // Keterangan di bawah tombol.
        const demoInfo = document.createElement('p');

        demoInfo.textContent =
            'Tanpa akun MySQL. Progres demo hanya tersimpan di browser ini.';

        Object.assign(demoInfo.style, {
            marginTop: '14px',
            color: '#bba98b',
            fontSize: '12px',
            lineHeight: '1.6',
            textAlign: 'center'
        });

        demoButton.insertAdjacentElement(
            'afterend',
            demoInfo
        );

        // ======================================
        // MASUK SEBAGAI PEMAIN DEMO
        // ======================================
        demoButton.addEventListener('click', async () => {
            if (pending) return;

            pending = true;
            demoButton.disabled = true;
            demoButton.textContent = 'MEMBUKA PETUALANGAN...';

            try {
                // Identitas khusus demo.
                // Tidak membuat akun MySQL.
                const demoEmail =
                    'demo@saga-petualang.local';

                // Session untuk kompatibilitas
                // dengan Shared/storage.js.
                sessionStorage.setItem(
                    'rpg_account_id',
                    demoEmail
                );

                sessionStorage.setItem(
                    'rpg_current_player',
                    'PETUALANG DEMO'
                );

                sessionStorage.removeItem(
                    'rpg_class_prompt_shown'
                );

                // Aktifkan profil lokal khusus demo.
                // Profil lama dipakai kembali
                // jika sudah pernah bermain demo.
                GameStorage.activate(demoEmail, {
                    isNew: false,
                    legacyAccounts: {}
                });

                // Masuk halaman karakter / utama.
                masukKeGame();

            } catch (error) {
                console.error('Mode demo gagal:', error);

                await Swal.fire({
                    icon: 'error',
                    title: 'Mode Demo gagal',
                    text: error.message,
                    background: '#13201b',
                    color: '#f2efe2',
                    confirmButtonColor: '#537359'
                });

                pending = false;
                demoButton.disabled = false;
                demoButton.textContent =
                    '⚔️ MAIN MODE DEMO';
            }
        });
    }
});
