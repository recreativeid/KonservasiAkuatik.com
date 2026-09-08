<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LandingPageController extends Controller
{
    /**
     * Display the KonservasiAkuatik.com landing page.
     */
    public function index()
    {
        $whatsappNumber = '6281234567890';
        $whatsappDisplay = '0812-3456-7890';

        $packages = [
            [
                'id' => 'klub',
                'name' => 'Kelas Klub',
                'badge' => 'Latihan Bersama',
                'subtitle' => 'Latihan Bersama Kelompok',
                'is_popular' => false,
                'description' => 'Program latihan berenang dalam kelompok dengan suasana latihan yang aktif, menyenangkan, dan suportif.',
                'price_prefix' => 'Mulai dari',
                'price' => 'Rp500.000',
                'period' => '/bulan',
                'note' => 'Jadwal latihan kelompok',
                'features' => [
                    'Latihan terjadwal',
                    'Cocok untuk berbagai level',
                    'Suasana latihan bersama',
                    'Pendampingan selama proses belajar',
                ],
                'cta_text' => 'PILIH KELAS KLUB',
                'cta_class' => 'btn-card-outline',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Klub di Kota Jambi. Mohon info jadwal dan lokasinya.',
            ],
            [
                'id' => 'privat',
                'name' => 'Kursus Privat',
                'badge' => 'Latihan Lebih Fokus',
                'subtitle' => 'Pendampingan Personal',
                'is_popular' => false,
                'description' => 'Program belajar berenang secara privat dengan latihan yang lebih terarah sesuai kebutuhan dan kemampuan peserta.',
                'price_prefix' => 'Biaya',
                'price' => 'Rp1.000.000',
                'period' => '/bulan',
                'note' => 'Jadwal latihan privat fleksibel',
                'features' => [
                    'Latihan lebih fokus',
                    'Program dapat disesuaikan',
                    'Cocok untuk pemula maupun tingkat lanjutan',
                    'Pendampingan lebih personal',
                ],
                'cta_text' => 'DAFTAR KURSUS PRIVAT',
                'cta_class' => 'btn-card-outline',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi. Mohon informasi ketersediaan jadwal.',
            ],
            [
                'id' => 'syaraf-terjepit',
                'name' => 'Kelas Syaraf Terjepit',
                'badge' => 'Rekomendasi Terapi',
                'subtitle' => 'Pendampingan Terapi Air',
                'is_popular' => true,
                'description' => 'Program latihan di dalam air yang dirancang untuk membantu memberikan rasa nyaman dan mendukung pergerakan tubuh bagi Anda yang mengalami keluhan syaraf terjepit.',
                'price_prefix' => 'Harga',
                'price' => 'Rp3.000.000',
                'period' => '/bulan',
                'note' => '8x pertemuan, durasi 2 jam',
                'features' => [
                    'Latihan di dalam air yang terarah',
                    'Disesuaikan dengan kondisi dan kemampuan',
                    'Membantu tubuh bergerak lebih nyaman',
                    'Pendampingan oleh pelatih selama latihan',
                ],
                'cta_text' => 'DAFTAR KELAS SYARAF TERJEPIT',
                'cta_class' => 'btn-card-primary',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Syaraf Terjepit (Pendampingan Terapi Air) di Kota Jambi. Mohon info ketersediaan jadwal.',
            ],
            [
                'id' => 'hydroterapi',
                'name' => 'Hydroterapi',
                'badge' => 'Terapi & Mobilitas',
                'subtitle' => 'Terapi & Latihan di Dalam Air',
                'is_popular' => false,
                'description' => 'Program latihan berbasis air dengan gerakan terarah untuk membantu meningkatkan mobilitas, fleksibilitas, dan kenyamanan tubuh dalam suasana latihan yang aman dan suportif.',
                'price_prefix' => 'Harga',
                'price' => 'Rp1.500.000',
                'period' => '/bulan',
                'note' => '4x pertemuan, durasi 1 jam',
                'features' => [
                    'Latihan menggunakan media air',
                    'Gerakan disesuaikan dengan kemampuan',
                    'Membantu meningkatkan fleksibilitas dan mobilitas',
                    'Pendampingan selama proses latihan',
                ],
                'cta_text' => 'DAFTAR HYDROTERAPI',
                'cta_class' => 'btn-card-outline',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Hydroterapi (Terapi & Latihan di Dalam Air) di Kota Jambi. Mohon info ketersediaan jadwal.',
            ],
        ];

        $targetAudience = [
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Balita',
                'description' => 'Pengenalan air ramah motorik dengan pendekatan menyenangkan agar terbiasa di dalam air sejak dini.',
                'icon' => 'child',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Anak-anak',
                'description' => 'Membangun kepercayaan diri, water safety, serta mempelajari teknik dasar berenang dengan nyaman.',
                'icon' => 'swimmer',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Remaja',
                'description' => 'Mengasah teknik kayuhan, efisiensi napas, ketahanan fisik, serta pembentukan postur tubuh prima.',
                'icon' => 'award',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Dewasa',
                'description' => 'Belajar berenang dari nol atau mengatasi rasa takut air dengan metode santai dan terstruktur.',
                'icon' => 'user-check',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Orang Tua',
                'description' => 'Olahraga akuatik rendah risiko cedera untuk menjaga kebugaran sendi, kesehatan jantung, dan kebugaran tubuh.',
                'icon' => 'heart-pulse',
            ],
        ];

        $timeSlots = [
            [
                'period' => 'PAGI HARI',
                'time' => '06.00 - 08.00 WIB',
                'note' => 'Udara sejuk & kolam tenang, optimal untuk fokus'
            ],
            [
                'period' => 'PAGI - SIANG',
                'time' => '08.30 - 11.00 WIB',
                'note' => 'Cocok untuk balita & anak sebelum siang'
            ],
            [
                'period' => 'SORE - MALAM',
                'time' => '15.30 - 18.00 WIB',
                'note' => 'Jadwal fleksibel sepulang sekolah atau kerja'
            ],
            [
                'period' => 'TERAPI AIR',
                'time' => 'Sesuai Kesepakatan',
                'note' => 'Jadwal khusus pendampingan terapi air'
            ],
        ];

        $branches = [
            [
                'name' => 'Kolam renang Citra Raya City',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang Citra Raya City Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang kampung Rajo',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang kampung Rajo Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang Puri Mayang',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang Puri Mayang Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang tepian Ratu',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang tepian Ratu Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang kota baru',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang kota baru Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang PWK Pasir Putih',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang PWK Pasir Putih Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang sungai sawang',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang sungai sawang Kota Jambi'),
            ],
            [
                'name' => 'Kolam renang World water park mendalo darat',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang World water park mendalo darat Jambi'),
            ],
            [
                'name' => 'Kolam renang Mayang club house',
                'gmaps' => 'https://www.google.com/maps/search/?api=1&query=' . rawurlencode('Kolam renang Mayang club house Kota Jambi'),
            ],
        ];

        $reasons = [
            [
                'title' => 'Fokus Membantu Peserta Cepat Bisa Berenang',
                'description' => 'Program dirancang agar peserta dapat belajar secara bertahap, memahami teknik dasar, dan membangun kepercayaan diri di dalam air.',
                'icon' => 'target',
            ],
            [
                'title' => 'Untuk Semua Usia',
                'description' => 'Mulai dari balita hingga orang tua dapat mengikuti program sesuai kemampuan masing-masing.',
                'icon' => 'users',
            ],
            [
                'title' => 'Latihan di Kolam Renang Kota Jambi',
                'description' => 'Lokasi latihan menyesuaikan domisili peserta di berbagai kolam renang yang tersedia di Kota Jambi.',
                'icon' => 'location-dot',
            ],
            [
                'title' => 'Program Terstruktur & Terapi Air',
                'description' => 'Peserta dapat memilih latihan bersama klub, kursus privat, maupun pendampingan terapi air khusus.',
                'icon' => 'award',
            ],
        ];

        $activities = [
            [
                'title' => '[ FOTO KEGIATAN ]',
                'description' => 'Dokumentasi kegiatan latihan kolam renang bersama tim KonservasiAkuatik.com.',
                'image' => asset('images/activity-1.jpg'),
            ],
            [
                'title' => '[ FOTO LATIHAN ]',
                'description' => 'Sesi belajar bersama pelatih dalam menguasai teknik dasar dan pernapasan.',
                'image' => asset('images/activity-2.jpg'),
            ],
            [
                'title' => '[ FOTO PESERTA ]',
                'description' => 'Momen pencapaian milestone kemampuan renang peserta dari berbagai usia.',
                'image' => asset('images/activity-3.jpg'),
            ],
        ];

        $testimonials = [
            [
                'name' => 'Peserta / Orang Tua Peserta 1',
                'role' => 'Orang Tua Siswa Balita & Anak (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Pengalaman pertama anak belajar renang di KonservasiAkuatik Kota Jambi sangat menyenangkan. Pelatihnya sabar dan telaten sehingga anak yang tadinya takut air sekarang jadi berani.',
            ],
            [
                'name' => 'Peserta 2',
                'role' => 'Peserta Dewasa Pemula (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Belajar renang saat dewasa ternyata tidak canggung di sini. Metode belajarnya santai dan terarah, dalam beberapa sesi sudah berani meluncur dan bernapas dengan ritmis.',
            ],
            [
                'name' => 'Peserta / Orang Tua Peserta 3',
                'role' => 'Peserta Kelas Klub (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Suasana latihan klub sangat positif dan suportif. Teman-teman berlatih bersama dan kemampuan berenang terus meningkat di setiap sesi latihan.',
            ],
        ];

        $priceTable = [
            [
                'program' => 'Kelas Klub',
                'harga' => 'Rp500.000/bulan',
                'cocok_untuk' => 'Peserta yang ingin berlatih bersama',
                'action_label' => 'PILIH KELAS KLUB',
                'is_popular' => false,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Klub di Kota Jambi.',
            ],
            [
                'program' => 'Kursus Privat',
                'harga' => 'Rp1.000.000/bulan',
                'cocok_untuk' => 'Peserta yang membutuhkan latihan lebih personal',
                'action_label' => 'DAFTAR KURSUS PRIVAT',
                'is_popular' => false,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi.',
            ],
            [
                'program' => 'Kelas Syaraf Terjepit',
                'harga' => 'Rp3.000.000/bulan',
                'cocok_untuk' => 'Pendampingan Terapi Air (8x pertemuan, durasi 2 jam)',
                'action_label' => 'DAFTAR SYARAF TERJEPIT',
                'is_popular' => true,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Syaraf Terjepit (Pendampingan Terapi Air) di Kota Jambi.',
            ],
            [
                'program' => 'Hydroterapi',
                'harga' => 'Rp1.500.000/bulan',
                'cocok_untuk' => 'Terapi & Latihan di Dalam Air (4x pertemuan, durasi 1 jam)',
                'action_label' => 'DAFTAR HYDROTERAPI',
                'is_popular' => false,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Hydroterapi di Kota Jambi.',
            ],
        ];

        return view('landing', compact(
            'whatsappNumber',
            'whatsappDisplay',
            'packages',
            'targetAudience',
            'timeSlots',
            'branches',
            'reasons',
            'activities',
            'testimonials',
            'priceTable'
        ));
    }

    /**
     * Handle slot check request.
     */
    public function checkSlot(Request $request)
    {
        $branch = $request->input('branch', 'Kota Jambi');
        $slot = $request->input('slot', 'Pagi Hari (06.00 - 08.00 WIB)');
        $phone = '6281234567890';

        $text = rawurlencode("Halo KonservasiAkuatik.com, saya ingin informasi jadwal latihan dan ketersediaan slot di: {$branch} ({$slot}).");
        $waUrl = "https://wa.me/{$phone}?text={$text}";

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Informasi jadwal latihan untuk area {$branch} ({$slot}) dapat disesuaikan.",
                'whatsapp_url' => $waUrl,
            ]);
        }

        return redirect()->away($waUrl);
    }
}
