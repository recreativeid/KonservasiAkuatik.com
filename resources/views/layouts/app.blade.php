<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    
    <title>@yield('title', 'Klub & Kursus Renang untuk Semua Usia di Kota Jambi - konservasiakuatik.fund')</title>
    <meta name="description" content="konservasiakuatik.fund hadir sebagai klub dan kursus renang untuk membantu siapa saja mulai dari balita, anak-anak, remaja, hingga orang tua agar semakin percaya diri dan mampu berenang dengan baik di Kota Jambi.">
    <meta name="keywords" content="klub renang jambi, kursus renang kota jambi, les renang anak jambi, privat renang jambi, pelatih renang kota jambi, renang balita jambi">
    <!-- Cache Control Headers for Fresh State -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <meta name="author" content="konservasiakuatik.fund">
    
    <!-- Open Graph / WhatsApp / Facebook Link Preview -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:title" content="Klub &amp; Kursus Renang untuk Semua Usia di Kota Jambi - konservasiakuatik.fund">
    <meta property="og:description" content="Belajar berenang lebih cepat, percaya diri, dan menyenangkan di Kota Jambi bersama konservasiakuatik.fund.">
    <meta property="og:image" content="{{ asset('images/logo_utama.jpg') }}">

    <!-- Twitter / Messaging Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Klub &amp; Kursus Renang untuk Semua Usia di Kota Jambi - konservasiakuatik.fund">
    <meta name="twitter:description" content="Belajar berenang lebih cepat, percaya diri, dan menyenangkan di Kota Jambi bersama konservasiakuatik.fund.">
    <meta name="twitter:image" content="{{ asset('images/logo_utama.jpg') }}">

    <!-- Theme Color & Favicon Logo Utama -->
    <meta name="theme-color" content="#0284c7">
    <link rel="icon" type="image/jpeg" href="{{ asset('images/logo_utama.jpg') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/logo_utama.jpg') }}">

    <!-- Fonts: Poppins -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

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
                <strong class="font-bold">konservasiakuatik.fund</strong> • Klub &amp; Kursus Renang untuk Semua Usia di Kota Jambi • 
                <a href="#program" class="underline hover:text-sky-600 transition-colors font-semibold ml-1">Pilih Program Kami <i class="fa-solid fa-angle-right text-xs"></i></a>
            </span>
        </div>
    </div>

    <!-- Navigation Header -->
    <header class="main-header" id="mainHeader">
        <div class="container-custom flex items-center justify-between py-4">
            <!-- Brand Logo (Main Logo Image Only) -->
            <a href="{{ route('home') }}" class="brand-logo inline-flex items-center">
                <img src="{{ asset('images/logo_utama.jpg') }}" alt="Konservasi Akuatik" class="brand-logo-img" style="height:46px; max-height:46px; width:auto; max-width:220px; object-fit:contain;">
            </a>

            <!-- Desktop Nav Items -->
            <nav class="desktop-nav">
                <a href="#program" class="nav-link">Program Latihan</a>
                <a href="#untuk-siapa" class="nav-link">Kategori Peserta</a>
                <a href="#jadwal" class="nav-link">Jadwal Latihan</a>
                <a href="#kenapa-kami" class="nav-link">Keunggulan</a>
                <a href="#lokasi" class="nav-link">Lokasi Latihan</a>
            </nav>

            <!-- Header Right Action -->
            <div class="header-actions">
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo konservasiakuatik.fund, saya ingin bertanya seputar klub dan kursus renang di Kota Jambi.') }}" 
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
                <a href="#program" class="mobile-link">Program Latihan</a>
                <a href="#untuk-siapa" class="mobile-link">Kategori Peserta</a>
                <a href="#jadwal" class="mobile-link">Jadwal Latihan</a>
                <a href="#kenapa-kami" class="mobile-link">Keunggulan Kami</a>
                <a href="#prestasi" class="mobile-link">Prestasi &amp; Milestone</a>
                <a href="#kegiatan" class="mobile-link">Dokumentasi Latihan</a>
                <a href="#testimoni" class="mobile-link">Testimoni Peserta</a>
                <a href="#lokasi" class="mobile-link">Lokasi Latihan</a>
                <hr class="border-slate-100 my-2">
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo konservasiakuatik.fund, saya ingin konsultasi dan mendaftar kursus renang di Kota Jambi.') }}" 
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
        <div class="container-custom py-14 text-center">
            <div class="text-center max-w-2xl mx-auto mb-8">
                <p class="text-sky-600 font-bold text-base sm:text-lg mb-4 text-center">
                    Belajar Berenang. Bangun Kepercayaan Diri. Raih Milestone Baru.
                </p>
                <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-700 text-center">
                    <div class="flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-person-swimming text-sky-600 mr-2"></i>
                        <span>Klub Renang, Privat &amp; Terapi Air</span>
                    </div>
                    <span class="hidden sm:inline text-slate-300">•</span>
                    <div class="flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-location-dot text-sky-600 mr-2"></i>
                        <span>Kota Jambi</span>
                    </div>
                    <span class="hidden sm:inline text-slate-300">•</span>
                    <a href="https://wa.me/{{ $whatsappNumber }}" target="_blank" class="flex items-center justify-center gap-1.5 text-slate-700 hover:text-emerald-600 transition-colors">
                        <i class="fa-brands fa-whatsapp text-emerald-500 text-base mr-2"></i>
                        <span>WhatsApp: {{ $whatsappDisplay }}</span>
                    </a>
                </div>
            </div>


            <!-- Secretariat Address Box (Centered) -->
            <div class="max-w-2xl mx-auto mb-8 p-4 sm:p-5 bg-sky-50/80 border border-sky-100 rounded-2xl text-center shadow-xs">
                <div class="inline-flex items-center justify-center gap-2 text-xs font-bold text-sky-700 bg-white px-3.5 py-1 rounded-full border border-sky-100 mb-2">
                    <i class="fa-solid fa-building-flag text-sky-600 mr-2"></i>
                    <span>ALAMAT SEKRETARIAT UTAMA</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed text-center">
                    {{ $secretariatAddress ?? 'Perum Panorama Sakura Asri Blok T No. 52, Jl. Penerangan, Kel. Kenali Besar, Kec. Alam Barajo, Kota Jambi, Jambi 36125' }}
                </p>
                <a href="{{ $secretariatGmaps ?? 'https://maps.app.goo.gl/u8TQr6hjZDnCQhmy6?g_st=awb' }}" 
                   target="_blank" 
                   class="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 mt-2 transition-colors">
                    <i class="fa-solid fa-map-location-dot mr-2"></i>
                    <span>Buka Peta Google Maps</span>
                    <i class="fa-solid fa-arrow-up-right-from-square text-2xs no-mr"></i>
                </a>
                <div class="mt-3 pt-3 border-t border-sky-200/60 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                    <i class="fa-solid fa-envelope text-sky-600 mr-1"></i>
                    <span>Email: <a href="mailto:konservasiakuatik.com@gmail.com" class="text-sky-600 hover:text-sky-700 hover:underline">konservasiakuatik.com@gmail.com</a></span>
                </div>
            </div>

            <!-- Bottom Copyright (Centered) -->
            <div class="pt-6 border-t border-slate-200/80 flex flex-col items-center justify-center text-center text-xs text-slate-500 gap-2.5">
                <p class="text-center">© {{ date('Y') }} konservasiakuatik.fund. All rights reserved. Kota Jambi.</p>
                <a href="#hero" class="hover:text-sky-600 transition-colors font-medium inline-flex items-center justify-center gap-1">
                    <span>Kembali ke Atas</span>
                    <i class="fa-solid fa-arrow-up text-xs"></i>
                </a>
            </div>
        </div>
    </footer>

    <!-- Floating WhatsApp Button -->
    <div class="floating-wa-container">
        <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo konservasiakuatik.fund, saya ingin konsultasi dan tanya jadwal kursus renang di Kota Jambi.') }}" 
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
