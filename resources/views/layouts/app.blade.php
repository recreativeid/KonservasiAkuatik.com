<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    
    <title>@yield('title', 'Klub & Kursus Renang untuk Semua Usia di Kota Jambi - KonservasiAkuatik.com')</title>
    <meta name="description" content="KonservasiAkuatik.com hadir sebagai klub dan kursus renang untuk membantu siapa saja mulai dari balita, anak-anak, remaja, hingga orang tua agar semakin percaya diri dan mampu berenang dengan baik di Kota Jambi.">
    <meta name="keywords" content="klub renang jambi, kursus renang kota jambi, les renang anak jambi, privat renang jambi, pelatih renang kota jambi, renang balita jambi">
    <meta name="author" content="KonservasiAkuatik.com">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="Klub & Kursus Renang untuk Semua Usia di Kota Jambi - KonservasiAkuatik.com">
    <meta property="og:description" content="Belajar berenang lebih cepat, percaya diri, dan menyenangkan di Kota Jambi bersama KonservasiAkuatik.com.">
    <meta property="og:image" content="{{ asset('images/hero-pool.jpg') }}">

    <!-- Theme Color -->
    <meta name="theme-color" content="#0284c7">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230284c7'><path d='M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z'/></svg>">

    <!-- Fonts: Plus Jakarta Sans -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Font Awesome 6 Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <!-- Custom Modern CSS with Cache Buster -->
    <link rel="stylesheet" href="{{ asset('css/landing.css') }}?v={{ time() }}">

    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body class="bg-white text-slate-800 antialiased selection:bg-sky-500 selection:text-white">

    <!-- Top Announcement Bar -->
    <div class="announcement-bar">
        <div class="container-custom flex items-center justify-center text-center text-xs sm:text-sm font-medium py-2">
            <span>
                <strong class="font-bold">KonservasiAkuatik.com</strong> • Klub &amp; Kursus Renang untuk Semua Usia di Kota Jambi • 
                <a href="#program" class="underline hover:text-sky-600 transition-colors font-semibold ml-1">Pilih Program Kami <i class="fa-solid fa-angle-right text-xs"></i></a>
            </span>
        </div>
    </div>

    <!-- Navigation Header -->
    <header class="main-header" id="mainHeader">
        <div class="container-custom flex items-center justify-between py-4">
            <!-- Brand Logo -->
            <a href="{{ route('home') }}" class="brand-logo flex items-center gap-2">
                <span class="logo-icon">
                    <i class="fa-solid fa-water"></i>
                </span>
                <span class="logo-text">
                    Konservasi<span class="text-sky-600">Akuatik</span><span class="text-xs text-slate-400 font-normal">.com</span>
                </span>
            </a>

            <!-- Desktop Nav Items -->
            <nav class="desktop-nav">
                <a href="#program" class="nav-link">Program</a>
                <a href="#untuk-siapa" class="nav-link">Untuk Siapa</a>
                <a href="#jadwal" class="nav-link">Jadwal</a>
                <a href="#kenapa-kami" class="nav-link">Kenapa Kami</a>
                <a href="#lokasi" class="nav-link">Lokasi</a>
            </nav>

            <!-- Header Right Action -->
            <div class="header-actions">
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin bertanya seputar klub dan kursus renang di Kota Jambi.') }}" 
                   target="_blank" 
                   class="contact-link flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                    <i class="fa-brands fa-whatsapp text-emerald-500 text-base"></i>
                    <span>WhatsApp</span>
                </a>
                <a href="#program" class="btn-primary-pill text-xs">
                    <span>Daftar Sekarang</span>
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                </a>
            </div>

            <!-- Mobile Hamburger Toggle -->
            <button type="button" class="mobile-toggle p-2 text-slate-700 hover:text-sky-600 focus:outline-none" id="mobileMenuBtn" aria-label="Buka Menu">
                <i class="fa-solid fa-bars text-xl" id="menuIcon"></i>
            </button>
        </div>

        <!-- Mobile Drawer Menu -->
        <div class="mobile-drawer hidden" id="mobileDrawer">
            <div class="flex flex-col gap-3.5 px-6 py-6 bg-white border-t border-slate-100 shadow-xl">
                <a href="#program" class="mobile-link">Program Kami</a>
                <a href="#untuk-siapa" class="mobile-link">Untuk Siapa Program Ini?</a>
                <a href="#jadwal" class="mobile-link">Jadwal Latihan</a>
                <a href="#kenapa-kami" class="mobile-link">Kenapa KonservasiAkuatik.com?</a>
                <a href="#prestasi" class="mobile-link">Prestasi &amp; Milestone</a>
                <a href="#kegiatan" class="mobile-link">Kegiatan Latihan</a>
                <a href="#testimoni" class="mobile-link">Cerita &amp; Testimoni Peserta</a>
                <a href="#lokasi" class="mobile-link">Lokasi Latihan</a>
                <hr class="border-slate-100 my-2">
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin konsultasi dan mendaftar kursus renang di Kota Jambi.') }}" 
                   target="_blank" 
                   class="btn-primary-pill justify-center text-center w-full">
                    <i class="fa-brands fa-whatsapp text-base"></i>
                    <span>Hubungi via WhatsApp</span>
                </a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main>
        @yield('content')
    </main>

    <!-- Footer -->
    <footer class="main-footer">
        <div class="container-custom py-14">
            <div class="text-center max-w-2xl mx-auto mb-8">
                <div class="flex items-center justify-center gap-2 mb-3">
                    <span class="logo-icon bg-sky-600 text-white p-2 rounded-xl text-lg inline-flex items-center justify-center">
                        <i class="fa-solid fa-water"></i>
                    </span>
                    <span class="text-2xl font-extrabold text-slate-900 tracking-tight">
                        KONVERSASIAKUATIK.COM
                    </span>
                </div>
                <p class="text-sky-600 font-bold text-base sm:text-lg mb-4">
                    Belajar Berenang. Bangun Kepercayaan Diri. Raih Milestone Baru.
                </p>
                <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700">
                    <div class="flex items-center gap-1.5">
                        <i class="fa-solid fa-person-swimming text-sky-600"></i>
                        <span>Klub Renang &amp; Kursus Privat</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-1.5">
                        <i class="fa-solid fa-location-dot text-sky-600"></i>
                        <span>Kota Jambi</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <a href="https://wa.me/{{ $whatsappNumber }}" target="_blank" class="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                        <i class="fa-brands fa-whatsapp text-emerald-500 text-base"></i>
                        <span>WhatsApp: 081*** ({{ $whatsappDisplay }})</span>
                    </a>
                </div>
            </div>

            <!-- Bottom Copyright -->
            <div class="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                <p>© {{ date('Y') }} KonservasiAkuatik.com. All rights reserved. Kota Jambi.</p>
                <div class="flex items-center gap-4">
                    <a href="#hero" class="hover:text-sky-600 transition-colors font-medium">Kembali ke Atas <i class="fa-solid fa-arrow-up text-xs ml-1"></i></a>
                </div>
            </div>
        </div>
    </footer>

    <!-- Floating WhatsApp Button -->
    <div class="floating-wa-container">
        <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin konsultasi dan tanya jadwal kursus renang di Kota Jambi.') }}" 
           target="_blank" 
           class="floating-wa-btn" 
           title="Chat WhatsApp Konsultasi Gratis">
            <i class="fa-brands fa-whatsapp"></i>
        </a>
    </div>

    <!-- Booking Modal / Slot Availability Popup -->
    <div class="modal-overlay hidden" id="slotModal">
        <div class="modal-card">
            <div class="modal-header">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>
                    <h3 class="text-base font-bold text-slate-800">Cek Ketersediaan Slot Latihan</h3>
                </div>
                <button type="button" class="text-slate-400 hover:text-slate-600 text-lg" id="closeModalBtn">&times;</button>
            </div>
            <div class="modal-body p-5 text-sm text-slate-600 space-y-3" id="modalContent">
                <!-- Injected dynamically via JS -->
            </div>
            <div class="modal-footer p-4 bg-slate-50 rounded-b-2xl flex justify-end gap-2">
                <button type="button" class="btn-secondary text-xs" id="closeModalBtn2">Tutup</button>
                <a href="#" target="_blank" class="btn-primary-pill text-xs" id="modalWaBtn">
                    <span>Hubungi via WhatsApp</span>
                    <i class="fa-brands fa-whatsapp"></i>
                </a>
            </div>
        </div>
    </div>

    <!-- Custom Scripts with Cache Buster -->
    <script src="{{ asset('js/landing.js') }}?v={{ time() }}"></script>
</body>
</html>
