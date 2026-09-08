<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class POSController extends Controller
{
    // ============================================================
    // AUTH HELPER
    // ============================================================
    private function getAuthUser()
    {
        $userId = session('user_id');
        if (!$userId) {
            return null;
        }
        $user = DB::table('users')->where('id', $userId)->first();
        if ($user) {
            $user->name = $user->nama; // alias for React components
        }
        return $user;
    }

    /**
     * Mengambil konfigurasi rekening Developer (pemilik platform) untuk
     * penerimaan pembayaran langganan. Bisa diubah sewaktu-waktu lewat
     * halaman Pengaturan Pembayaran (disimpan di tabel meta).
     */
    private function getDevPaymentConfig()
    {
        $get = function ($key, $default) {
            $row = DB::table('meta')->where('key', $key)->first();
            return $row ? $row->value : $default;
        };

        return [
            'qris_string' => $get('dev_payment_qris_string', env('DEVELOPER_STATIC_QRIS', '00020101021126570014ID.CO.QRPAY.WWW011893600520000000000102150001234567890120303UMI51440014ID.CO.QRIS.WWW02150001234567890120303UMI5204000053033605802ID5922MUHAMMAD%20FATHUR%20ROHMAN6007Jakarta6304')),
            'bank_name' => $get('dev_payment_bank_name', 'Bank Central Asia (BCA)'),
            'no_rekening' => $get('dev_payment_no_rekening', '1222338764'),
            'nama_pemilik' => $get('dev_payment_nama_pemilik', 'Muhammad Fathur Rohman'),
            'prices' => [
                'monthly' => (int)$get('dev_sub_price_monthly', 99000),
                '3months' => (int)$get('dev_sub_price_3months', 250000),
                'yearly' => (int)$get('dev_sub_price_yearly', 830000),
            ],
        ];
    }

    /**
     * Memeriksa tipe paket langganan aktif suatu toko (dengan validasi expiry date).
     */
    private function getActiveSubscriptionTier($tokoId)
    {
        $tierMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_tier')->first();
        $expiryMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_expiry')->first();

        $tier = $tierMeta ? $tierMeta->value : 'free';
        $expiry = $expiryMeta ? $expiryMeta->value : null;

        if ($tier !== 'free' && $expiry && strtotime($expiry) < time()) {
            return 'free'; // auto-downgrade to free if expired
        }
        return $tier;
    }

    /**
     * Mengambil nominal biaya transaksi paket gratis secara dinamis dari tabel meta.
     */
    private function getFreePlanTransactionFee()
    {
        $row = DB::table('meta')->where('key', 'dev_free_plan_transaction_fee')->first();
        return $row ? (int)$row->value : 500;
    }

    // ============================================================
    // ROUTES
    // ============================================================
    public function landing()
    {
        $user = $this->getAuthUser();
        if ($user) {
            if ($user->role === 'admin') {
                return redirect()->route('dashboard');
            } else {
                return redirect()->route('verifikasi');
            }
        }
        $devPayment = $this->getDevPaymentConfig();
        $freePlanFee = $this->getFreePlanTransactionFee();
        return Inertia::render('Landing', [
            'dev_payment' => [
                'prices' => $devPayment['prices'],
                'free_plan_fee' => $freePlanFee
            ]
        ]);
    }

    public function pembeliMenu(Request $request)
    {
        $tokoId = $request->query('id_toko', 1);
        $menus = DB::table('menu')->where('id_toko', $tokoId)->where('aktif', 1)->get();
        $qris = DB::table('qris_config')->where('id_toko', $tokoId)->first();
        $toko = DB::table('toko')->where('id', $tokoId)->first();

        $subTier = $this->getActiveSubscriptionTier($tokoId);
        $freePlanFee = $this->getFreePlanTransactionFee();

        $waMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_no_wa')->first();
        $waNumber = $waMeta ? $waMeta->value : null;

        $staffs = DB::table('users')
            ->where('id_toko', $tokoId)
            ->where('role', 'karyawan')
            ->select('nama', 'username')
            ->get();

        return Inertia::render('PembeliMenu', [
            'menus' => $menus,
            'qris' => $qris,
            'id_toko' => (int)$tokoId,
            'toko' => $toko,
            'subscription_tier' => $subTier,
            'free_plan_fee' => $freePlanFee,
            'wa_number' => $waNumber,
            'staffs' => $staffs
        ]);
    }

    public function pembeliRiwayat(Request $request)
    {
        $sessionId = $request->query('session_id');
        if (!$sessionId) {
            return redirect()->route('pembeli.menu');
        }

        $orders = DB::table('transaksi')->where('session_id', $sessionId)->orderBy('created_at', 'desc')->get();
        // Decode items inside orders
        foreach ($orders as $ord) {
            $ord->items = DB::table('transaksi_items')
                ->join('menu', 'transaksi_items.id_menu', '=', 'menu.id')
                ->where('transaksi_items.order_id', $ord->order_id)
                ->select('transaksi_items.*', 'menu.nama_menu', 'menu.harga')
                ->get();
        }

        $balance = DB::table('e_wallet')->where('session_id', $sessionId)->value('saldo') ?? 0;
        $walletHistory = DB::table('wallet_transactions')->where('session_id', $sessionId)->orderBy('created_at', 'desc')->get();

        return Inertia::render('PembeliRiwayat', [
            'orders' => $orders,
            'wallet_balance' => (int)$balance,
            'wallet_history' => $walletHistory,
            'session_id' => $sessionId,
        ]);
    }

    public function pembeliSuccess(Request $request)
    {
        $orderId = $request->query('order_id');
        $order = DB::table('transaksi')->where('order_id', $orderId)->first();
        if (!$order) {
            return redirect()->route('pembeli.menu');
        }

        $items = DB::table('transaksi_items')
            ->join('menu', 'transaksi_items.id_menu', '=', 'menu.id')
            ->where('transaksi_items.order_id', $orderId)
            ->select('transaksi_items.*', 'menu.nama_menu', 'menu.harga')
            ->get();

        return Inertia::render('PembeliSuccess', [
            'order' => $order,
            'items' => $items,
        ]);
    }

    public function loginPage()
    {
        $user = $this->getAuthUser();
        if ($user) {
            if ($user->role === 'admin') {
                return redirect()->route('dashboard');
            } else {
                return redirect()->route('verifikasi');
            }
        }
        $devPayment = $this->getDevPaymentConfig();
        $freePlanFee = $this->getFreePlanTransactionFee();
        return Inertia::render('Login', [
            'dev_payment' => [
                'prices' => $devPayment['prices'],
                'free_plan_fee' => $freePlanFee
            ]
        ]);
    }

    public function loginStaff(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $username = $request->input('username');
        $password = $request->input('password');

        $user = DB::table('users')->where('username', $username)->first();

        if ($user && password_verify($password, $user->password)) {
            session([
                'user_id' => $user->id,
                'role' => $user->role,
                'name' => $user->nama,
                'id_toko' => $user->id_toko,
            ]);

            // Update last login
            DB::table('users')->where('id', $user->id)->update([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'role' => $user->role,
                'name' => $user->nama,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Username atau password salah.',
        ], 401);
    }

    public function registerAdmin(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'username' => 'required|string|unique:users,username|max:255',
            'password' => 'required|string|min:6',
            'nama_toko' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            // 1. Create user first
            $userId = DB::table('users')->insertGetId([
                'nama' => $request->nama,
                'username' => $request->username,
                'password' => password_hash($request->password, PASSWORD_BCRYPT),
                'role' => 'admin',
                'id_toko' => null, // will update later
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Create default toko
            $tokoId = DB::table('toko')->insertGetId([
                'id_admin' => $userId,
                'nama_toko' => $request->nama_toko,
                'deskripsi' => 'Profil Toko baru yang belum dikonfigurasi.',
                'alamat' => 'Alamat Toko Baru',
                'kota' => 'Jakarta Pusat',
                'provinsi' => 'DKI Jakarta',
                'latitude' => -6.175392,
                'longitude' => 106.827153,
                'jam_buka' => '08:00:00',
                'jam_tutup' => '22:00:00',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Update user to point to toko
            DB::table('users')->where('id', $userId)->update(['id_toko' => $tokoId]);

            // 4. Create default QRIS config
            DB::table('qris_config')->insert([
                'id_toko' => $tokoId,
                'nama_pemilik' => $request->nama_toko,
                'no_rekening' => '0000000000',
                'tipe_qris' => 'statis',
                'image_path' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 5. Create default Absensi config
            DB::table('absensi_config')->insert([
                'id_toko' => $tokoId,
                'jam_masuk' => '08:00:00',
                'jam_pulang' => '17:00:00',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            // Auto-login after registration
            session([
                'user_id' => $userId,
                'role' => 'admin',
                'name' => $request->nama,
                'id_toko' => $tokoId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registrasi berhasil!',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan registrasi: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function logout()
    {
        session()->forget(['user_id', 'role', 'name']);
        return redirect()->route('login');
    }

    public function dashboard(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return redirect()->route('login');
        }

        // Standard statistics for widgets
        $revenue = DB::table('transaksi')->where('id_toko', $user->id_toko)->where('status_pembayaran', 'lunas')->sum('total_biaya');
        $ordersCount = DB::table('transaksi')->where('id_toko', $user->id_toko)->count();
        $customersCount = DB::table('transaksi')->where('id_toko', $user->id_toko)->distinct('session_id')->count('session_id');

        // Target prediction summary
        $predictions = DB::table('hasil_prediksi')->where('id_toko', $user->id_toko)->get();

        // Chart data: revenue of last 7 days
        $chartData = DB::table('transaksi')
            ->select(DB::raw('DATE(tanggal) as date'), DB::raw('SUM(total_biaya) as total'))
            ->where('id_toko', $user->id_toko)
            ->where('status_pembayaran', 'lunas')
            ->where('tanggal', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderBy('date', 'asc')
            ->get();

        // Chart data: total cups/menu items sold of last 7 days (manual + online)
        $manualDaily = DB::table('transaksi')
            ->select(DB::raw('DATE(tanggal) as date'), DB::raw('SUM(jumlah) as qty'))
            ->where('id_toko', $user->id_toko)
            ->where('status_pembayaran', 'lunas')
            ->whereNotNull('id_menu')
            ->where('tanggal', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(tanggal)'));

        $onlineDaily = DB::table('transaksi_items')
            ->join('transaksi', 'transaksi_items.order_id', '=', 'transaksi.order_id')
            ->select(DB::raw('DATE(transaksi.tanggal) as date'), DB::raw('SUM(transaksi_items.jumlah) as qty'))
            ->where('transaksi.id_toko', $user->id_toko)
            ->where('transaksi.status_pembayaran', 'lunas')
            ->where('transaksi.tanggal', '>=', now()->subDays(7))
            ->groupBy(DB::raw('DATE(transaksi.tanggal)'));

        $menuChartData = DB::query()
            ->fromSub(function ($query) use ($manualDaily, $onlineDaily) {
                $query->from($manualDaily->unionAll($onlineDaily), 'union_daily_qty');
            }, 'uq')
            ->select('date', DB::raw('SUM(qty) as total'))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // History predictions
        $predHistory = DB::table('hasil_prediksi')
            ->where('id_toko', $user->id_toko)
            ->orderBy('wmape', 'asc')
            ->limit(5)
            ->get();

        // Top predicted menu
        $topPredicted = DB::table('hasil_prediksi')
            ->where('id_toko', $user->id_toko)
            ->orderBy('prediksi_cup', 'desc')
            ->limit(5)
            ->get();

        // Query raw material predictions (predicted requirements vs current stock)
        $materialPredictions = DB::table('rekomendasi_belanja as rb')
            ->join('barang as b', 'rb.id_barang', '=', 'b.id')
            ->where('rb.id_toko', $user->id_toko)
            ->select('b.nama_barang', 'b.satuan', DB::raw('SUM(rb.prediksi_kebutuhan) as total_kebutuhan'), DB::raw('SUM(rb.stok_gudang) as total_stok'))
            ->groupBy('b.id', 'b.nama_barang', 'b.satuan')
            ->orderBy('total_kebutuhan', 'desc')
            ->limit(7)
            ->get();

        return Inertia::render('Dashboard', [
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ],
            'stats' => [
                'revenue' => (int)$revenue,
                'orders' => $ordersCount,
                'customers' => $customersCount,
            ],
            'predictions' => $predictions,
            'chart_data' => $chartData,
            'menu_chart_data' => $menuChartData,
            'material_predictions' => $materialPredictions,
            'history' => $predHistory,
            'top_predicted' => $topPredicted,
            'subscription_tier' => $this->getActiveSubscriptionTier($user->id_toko),
            'subscription_expiry' => ($expiryMeta = DB::table('meta')->where('key', 'toko_' . $user->id_toko . '_subscription_expiry')->first()) ? $expiryMeta->value : null,
            'notifications' => DB::table('transaksi')
                ->where('id_toko', $user->id_toko)
                ->where('created_at', '>=', now()->subDays(3))
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
        ]);
    }

    public function verifikasiPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || !in_array($user->role, ['admin', 'kasir', 'karyawan'])) {
            return redirect()->route('login');
        }

        $pendingOrders = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->where('status_pesanan', 'dipesan')
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($pendingOrders as $ord) {
            $ord->items = DB::table('transaksi_items')
                ->join('menu', 'transaksi_items.id_menu', '=', 'menu.id')
                ->where('transaksi_items.order_id', $ord->order_id)
                ->select('transaksi_items.*', 'menu.nama_menu', 'menu.harga', 'menu.gambar')
                ->get();
        }

        $activeOrders = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->whereIn('status_pesanan', ['diproses', 'siap'])
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($activeOrders as $ord) {
            $ord->items = DB::table('transaksi_items')
                ->join('menu', 'transaksi_items.id_menu', '=', 'menu.id')
                ->where('transaksi_items.order_id', $ord->order_id)
                ->select('transaksi_items.*', 'menu.nama_menu', 'menu.harga', 'menu.gambar')
                ->get();
        }

        $pendingTopups = DB::table('wallet_transactions')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        $historyOrders = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->whereIn('status_pesanan', ['selesai', 'dibatalkan'])
            ->orderBy('created_at', 'desc')
            ->limit(30)
            ->get();

        foreach ($historyOrders as $ord) {
            $ord->items = DB::table('transaksi_items')
                ->join('menu', 'transaksi_items.id_menu', '=', 'menu.id')
                ->where('transaksi_items.order_id', $ord->order_id)
                ->select('transaksi_items.*', 'menu.nama_menu', 'menu.harga', 'menu.gambar')
                ->get();
        }

        return Inertia::render('Verifikasi', [
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
                'id_toko' => $user->id_toko
            ],
            'pending_orders' => $pendingOrders,
            'active_orders' => $activeOrders,
            'history_orders' => $historyOrders,
            'pending_topups' => $pendingTopups,
        ]);
    }

    // ============================================================
    // APIS & POST TRANSACTIONS
    // ============================================================
    public function placeOrder(Request $request)
    {
        $request->validate([
            'session_id' => 'required',
            'metode_pembayaran' => 'required',
            'items' => 'required|array',
            'nama_pembeli' => 'nullable|string|max:100',
        ]);

        $sessionId = $request->input('session_id');
        $method = $request->input('metode_pembayaran');
        $items = $request->input('items');
        $namaPembeli = $request->input('nama_pembeli', 'Pembeli');

        $orderId = 'TRX-' . strtoupper(substr(uniqid(), 7)) . '-' . rand(10, 99);
        $totalCost = 0;

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $menu = DB::table('menu')->where('id', $item['id_menu'])->first();
                if (!$menu) {
                    throw new \Exception('Menu tidak ditemukan.');
                }
                $qty = $item['jumlah'] ?? $item['qty'] ?? 1;
                $cost = $menu->harga * $qty;
                $totalCost += $cost;

                DB::table('transaksi_items')->insert([
                    'order_id' => $orderId,
                    'id_menu' => $item['id_menu'],
                    'jumlah' => $qty,
                    'subtotal' => $cost,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // No tax or service fee for buyers
            $tax = 0;
            $grandTotal = $totalCost;

            // Determine initial statuses based on payment method and source
            $statusPembayaran = 'belum_bayar';
            $statusPesanan = 'dipesan';
            if ($method === 'cash' && $request->input('sumber') === 'kasir') {
                $statusPembayaran = 'lunas';
                $statusPesanan = 'diproses';
            }

            // Generate queue number (nomor_antrian)
            $today = now()->format('Y-m-d');
            $todayCount = DB::table('transaksi')
                ->where('tanggal', 'like', $today . '%')
                ->count();
            $queueNumber = str_pad($todayCount + 1, 3, '0', STR_PAD_LEFT);

            DB::table('transaksi')->insert([
                'order_id' => $orderId,
                'id_toko' => $request->input('id_toko', 1),
                'nama_pembeli' => $namaPembeli,
                'session_id' => $sessionId,
                'tanggal' => now(),
                'total_biaya' => $grandTotal,
                'status_pembayaran' => $statusPembayaran,
                'status_pesanan' => $statusPesanan,
                'nomor_antrian' => $queueNumber,
                'metode_pembayaran' => $method,
                'sumber' => $request->input('sumber', 'online'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();
            return response()->json([
                'success' => true,
                'order_id' => $orderId,
                'nomor_antrian' => $queueNumber,
                'total_biaya' => $grandTotal,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function uploadProof(Request $request)
    {
        $request->validate([
            'order_id' => 'required',
            'bukti_qris' => 'required|image|max:5120',
        ]);

        $orderId = $request->input('order_id');
        $file = $request->file('bukti_qris');

        // Store file inside public/uploads folder
        $imagePath = $this->compressImage($file, 'uploads', 'proof_' . $orderId);

        DB::table('transaksi')->where('order_id', $orderId)->update([
            'bukti_pembayaran' => $imagePath,
            'status_pembayaran' => 'pending_verifikasi',
            'status_pesanan' => 'dipesan',
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah. Silakan tunggu verifikasi kasir.',
        ]);
    }

    public function verifyOrder(Request $request)
    {
        $request->validate([
            'order_id' => 'required',
            'status_pesanan' => 'required',
            'status_pembayaran' => 'required',
        ]);

        $orderId = $request->input('order_id');
        $statusPesanan = $request->input('status_pesanan');
        $statusPembayaran = $request->input('status_pembayaran');

        $oldOrder = DB::table('transaksi')->where('order_id', $orderId)->first();
        if (!$oldOrder) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        DB::beginTransaction();
        try {
            DB::table('transaksi')->where('order_id', $orderId)->update([
                'status_pesanan' => $statusPesanan,
                'status_pembayaran' => $statusPembayaran,
                'updated_at' => now(),
            ]);

            // Deduct stock if payment goes to lunas and order goes to diproses
            if ($statusPembayaran === 'lunas' && $statusPesanan === 'diproses' && $oldOrder->status_pembayaran !== 'lunas') {
                $orderItems = DB::table('transaksi_items')->where('order_id', $orderId)->get();
                foreach ($orderItems as $item) {
                    $this->deductStock($item->id_menu, $item->jumlah);
                }
            }

            DB::commit();
            return response()->json([
                'success' => true,
                'message' => 'Status pesanan berhasil diperbarui.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal verifikasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getOrderStatus($id)
    {
        $order = DB::table('transaksi')->where('order_id', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Pesanan tidak ditemukan.'], 404);
        }

        // AUTO-VERIFICATION FOR CUSTOMERS (QRIS & VA)
        if ($order->status_pembayaran === 'belum_bayar' && in_array($order->metode_pembayaran, ['qris', 'va'])) {
            $storeBcaUser = env('STORE_BCA_USER');
            $storeBcaPin = env('STORE_BCA_PIN');
            $verified = false;

            if (!empty($storeBcaUser) && !empty($storeBcaPin) && $storeBcaUser !== 'MOCK_USER') {
                // Real KlikBCA Scraper check
                $check = \App\Services\BCAScraper::checkMutation($storeBcaUser, $storeBcaPin, $order->total_biaya);
                if ($check['success']) {
                    $verified = true;
                }
            } else {
                // Simulation/demo: auto-verify after 8 seconds of polling
                $secondsElapsed = time() - strtotime($order->created_at);
                if ($secondsElapsed >= 8) {
                    $verified = true;
                }
            }

            if ($verified) {
                DB::beginTransaction();
                try {
                    DB::table('transaksi')->where('order_id', $id)->update([
                        'status_pembayaran' => 'lunas',
                        'status_pesanan' => 'diproses',
                        'updated_at' => now()
                    ]);

                    // Deduct stock for all items
                    $orderItems = DB::table('transaksi_items')->where('order_id', $id)->get();
                    foreach ($orderItems as $item) {
                        $this->deductStock($item->id_menu, $item->jumlah);
                    }

                    DB::commit();

                    // Reload order info
                    $order = DB::table('transaksi')->where('order_id', $id)->first();
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error("Gagal auto-verifikasi transaksi pelanggan: " . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'order_id' => $order->order_id,
            'status_pembayaran' => $order->status_pembayaran,
            'status_pesanan' => $order->status_pesanan,
            'nomor_antrian' => $order->nomor_antrian
        ]);
    }

    // ============================================================
    // PREDICTION MATH (SES ALGORITHM)
    // ============================================================
    public function runPrediction(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return response()->json(['success' => false, 'message' => 'Unauthorized'], 403); }

        $tokoId = $user->id_toko;

        // 1. Delete old data for this store safely
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');
        // Delete rekomendasi_belanja associated with this store's predictions
        DB::table('rekomendasi_belanja')->where('id_toko', $tokoId)->delete();
        DB::table('hasil_prediksi')->where('id_toko', $tokoId)->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS = 1');

        $menus = DB::table('menu')->where('id_toko', $tokoId)->where('aktif', 1)->get();
        $nowStr = now()->toDateTimeString();

        foreach ($menus as $menu) {
            $rawSeries = $this->getWeeklyAggregation($menu->id);
            
            $predictionCup = 0;
            $alpha = 0.5;
            $wmape = 100.0;
            $isValid = 0;

            if (count($rawSeries) >= 3) {
                $smoothed = $this->movingAvgSmooth($rawSeries);
                $ses = $this->runSES($smoothed);
                $predictionCup = $ses['prediction'];
                $alpha = $ses['alpha'];
                $wmape = $ses['wmape'];
                $isValid = $ses['valid'] ? 1 : 0;
            } else {
                // Fallback to average weekly sold if we have some data, otherwise 0
                $predictionCup = count($rawSeries) > 0 ? (int)round(array_sum($rawSeries) / count($rawSeries)) : 0;
            }

            $pid = DB::table('hasil_prediksi')->insertGetId([
                'id_toko' => $tokoId,
                'id_menu' => $menu->id,
                'nama_menu' => $menu->nama_menu,
                'prediksi_cup' => $predictionCup,
                'alpha_terpilih' => $alpha,
                'wmape' => $wmape,
                'is_valid' => $isValid,
            ]);

            // Calculate material stock recommendations
            $sops = DB::table('sop')->where('id_menu', $menu->id)->get();
            foreach ($sops as $sop) {
                $predKebutuhan = $predictionCup * (float)$sop->gramasi;
                $barang = DB::table('barang')->where('id', $sop->id_barang)->first();
                if ($barang) {
                    $stokSaatIni = (float)$barang->stok_gudang;
                    $safetyStock = ($predKebutuhan / 7) * (int)$barang->safety_stock_hari;
                    $kebutuhan = $predKebutuhan + $safetyStock - $stokSaatIni;
                    $kebutuhanBelanja = max(0.0, ceil($kebutuhan));

                    DB::table('rekomendasi_belanja')->insert([
                        'id_toko' => $tokoId,
                        'id_prediksi' => $pid,
                        'id_barang' => $sop->id_barang,
                        'prediksi_kebutuhan' => $predKebutuhan,
                        'safety_stock' => $safetyStock,
                        'stok_gudang' => $stokSaatIni,
                        'kebutuhan_belanja' => $kebutuhanBelanja,
                    ]);
                }
            }
        }

        // Save last prediction time meta for this store
        DB::table('meta')->updateOrInsert(
            ['key' => 'last_prediction_' . $tokoId],
            ['value' => $nowStr]
        );

        return response()->json([
            'success' => true,
            'message' => 'Proses kalkulasi prediksi stok menggunakan metode SES (Single Exponential Smoothing) selesai!',
        ]);
    }

    private function getWeeklyAggregation($menuId)
    {
        $onlineSales = DB::table('transaksi')
            ->join('transaksi_items', 'transaksi.order_id', '=', 'transaksi_items.order_id')
            ->where('transaksi_items.id_menu', $menuId)
            ->where('transaksi.status_pembayaran', 'lunas')
            ->select('transaksi.tanggal', DB::raw('SUM(transaksi_items.jumlah) as total'))
            ->groupBy('transaksi.tanggal');

        $manualSales = DB::table('transaksi')
            ->where('transaksi.id_menu', $menuId)
            ->where('transaksi.status_pembayaran', 'lunas')
            ->select('transaksi.tanggal', DB::raw('SUM(transaksi.jumlah) as total'))
            ->groupBy('transaksi.tanggal');

        $rows = $onlineSales->unionAll($manualSales)
            ->orderBy('tanggal', 'asc')
            ->get();

        if ($rows->isEmpty()) {
            return [];
        }

        $firstDate = new \DateTime($rows[0]->tanggal);
        $weekMap = [];

        foreach ($rows as $row) {
            $d = new \DateTime($row->tanggal);
            $diff = $d->getTimestamp() - $firstDate->getTimestamp();
            $weekIdx = (int)floor($diff / (7 * 24 * 3600));
            if (!isset($weekMap[$weekIdx])) {
                $weekMap[$weekIdx] = 0;
            }
            $weekMap[$weekIdx] += (int)$row->total;
        }

        $maxWeek = max(array_keys($weekMap));
        $series = [];
        for ($w = 0; $w <= $maxWeek; $w++) {
            $series[] = $weekMap[$w] ?? 0;
        }
        return $series;
    }

    private function movingAvgSmooth($series)
    {
        if (empty($series)) {
            return [];
        }
        $smoothed = [$series[0]];
        for ($k = 1; $k < count($series); $k++) {
            $smoothed[] = (int)round(($series[$k] + $series[$k - 1]) / 2);
        }
        return $smoothed;
    }

    private function runSES($series)
    {
        $len = count($series);
        if ($len < 2) {
            return ['prediction' => 0, 'alpha' => 0.5, 'wmape' => 100.0, 'valid' => false];
        }

        $bestWmape = INF;
        $bestAlpha = 0.5;
        $bestFinalPred = $series[0];

        // Search alpha (0.01 - 0.99)
        for ($a = 1; $a <= 99; $a++) {
            $alpha = $a / 100;
            $sumErr = 0;
            $sumAct = 0;
            $pred = $series[0];

            for ($k = 1; $k < $len; $k++) {
                $actual = $series[$k];
                $rounded = (int)round($pred);
                $sumErr += abs($actual - $rounded);
                $sumAct += $actual;
                $pred = $alpha * $actual + (1 - $alpha) * $pred;
            }

            $wmape = $sumAct === 0 ? ($sumErr > 0 ? 100.0 : 0.0) : ($sumErr / $sumAct) * 100.0;
            if ($wmape < $bestWmape) {
                $bestWmape = $wmape;
                $bestAlpha = $alpha;
                $bestFinalPred = $pred;
            }
        }

        $nextPred = $bestAlpha * $series[$len - 1] + (1 - $bestAlpha) * $bestFinalPred;
        return [
            'prediction' => (int)round($nextPred),
            'alpha' => (float)round($bestAlpha, 3),
            'wmape' => (float)round($bestWmape, 2),
            'valid' => $bestWmape <= 5.0,
        ];
    }

    // ============================================================
    // KELOLA MENU CRUD & STATUS TOGGLE (ADMIN)
    // ============================================================
    public function listMenuAdmin(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') { return redirect()->route('login'); }
        $menus = DB::table('menu')->where('id_toko', $user->id_toko)->get();
        return Inertia::render('KelolaMenu', ['menus' => $menus, 'user' => $user]);
    }

    public function storeMenu(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return response()->json(['success' => false, 'message' => 'Unauthorized'], 403); }

        $request->validate([
            'nama_menu' => 'required|string|max:255',
            'harga' => 'required|integer|min:0',
            'aktif' => 'required|integer',
            'keterangan' => 'nullable|string',
            'gambar_file' => 'nullable|image|max:5120'
        ]);

        $imagePath = null;
        if ($request->hasFile('gambar_file')) {
            $imagePath = $this->compressImage($request->file('gambar_file'), 'uploads', 'menu');
        }

        $insertId = DB::table('menu')->insertGetId([
            'id_toko' => $user->id_toko,
            'nama_menu' => $request->nama_menu,
            'harga' => $request->harga,
            'keterangan' => $request->keterangan ?? 'Minuman spesial racikan.',
            'aktif' => $request->aktif,
            'gambar' => $imagePath
        ]);

        $newMenu = DB::table('menu')->where('id', $insertId)->first();

        return response()->json(['success' => true, 'message' => 'Menu berhasil ditambahkan!', 'menu' => $newMenu]);
    }

    public function updateMenu(Request $request, $id)
    {
        $user = $this->getAuthUser();
        if (!$user) { return response()->json(['success' => false, 'message' => 'Unauthorized'], 403); }

        $request->validate([
            'nama_menu' => 'required|string|max:255',
            'harga' => 'required|integer|min:0',
            'aktif' => 'required|integer',
            'keterangan' => 'nullable|string',
            'gambar_file' => 'nullable|image|max:5120'
        ]);

        $menu = DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->first();
        if (!$menu) { return response()->json(['success' => false, 'message' => 'Menu tidak ditemukan.'], 404); }

        $updateData = [
            'nama_menu' => $request->nama_menu,
            'harga' => $request->harga,
            'keterangan' => $request->keterangan ?? $menu->keterangan,
            'aktif' => $request->aktif
        ];

        if ($request->hasFile('gambar_file')) {
            // Delete old file if exists
            if ($menu->gambar && file_exists(public_path($menu->gambar))) {
                @unlink(public_path($menu->gambar));
            }
            $updateData['gambar'] = $this->compressImage($request->file('gambar_file'), 'uploads', 'menu');
        }

        DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->update($updateData);

        $updatedMenu = DB::table('menu')->where('id', $id)->first();

        return response()->json(['success' => true, 'message' => 'Menu berhasil diperbarui!', 'menu' => $updatedMenu]);
    }

    public function deleteMenu($id)
    {
        $user = $this->getAuthUser();
        if (!$user) { return response()->json(['success' => false, 'message' => 'Unauthorized'], 403); }

        $menu = DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->first();
        if (!$menu) { return response()->json(['success' => false, 'message' => 'Menu tidak ditemukan.'], 404); }

        if ($menu->gambar && file_exists(public_path($menu->gambar))) {
            @unlink(public_path($menu->gambar));
        }

        DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->delete();
        return response()->json(['success' => true, 'message' => 'Menu berhasil dihapus!']);
    }

    public function toggleMenuStatus(Request $request, $id)
    {
        $user = $this->getAuthUser();
        if (!$user) { return response()->json(['success' => false, 'message' => 'Unauthorized'], 403); }

        $menu = DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->first();
        if (!$menu) { return response()->json(['success' => false, 'message' => 'Menu tidak ditemukan.'], 404); }

        $newStatus = $menu->aktif == 1 ? 0 : 1;
        DB::table('menu')->where('id', $id)->where('id_toko', $user->id_toko)->update(['aktif' => $newStatus]);

        return response()->json([
            'success' => true, 
            'aktif' => $newStatus, 
            'message' => 'Status menu berhasil diubah!'
        ]);
    }

    // ============================================================
    // TERMINAL KASIR (CRUD ORDER MANUAL KASIR)
    // ============================================================
    public function listPosTerminal(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return redirect()->route('login'); }
        $menus = DB::table('menu')->where('id_toko', $user->id_toko)->get();
        $qris = DB::table('qris_config')->where('id_toko', $user->id_toko)->first();

        // Get total manual cash transaction sum by this cashier today
        $today = date('Y-m-d');
        $cashierRevenue = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->where('sumber', 'kasir')
            ->where('tanggal', $today)
            ->where('status_pembayaran', 'lunas')
            ->sum('total_biaya') ?? 0;

        $recentTransactions = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->where('tanggal', $today)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('PosTerminal', [
            'menus' => $menus,
            'qris' => $qris,
            'user' => $user,
            'cashier_revenue' => (int)$cashierRevenue,
            'recent_transactions' => $recentTransactions
        ]);
    }

    // ============================================================
    // KEUANGAN INTEGRATIF (LABA RUGI, CASH FLOW, MUTASI)
    // ============================================================
    public function listFinanceAdmin(Request $request)
    {
        $this->cleanupOldTransferProofs();
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') { return redirect()->route('login'); }

        $today = date('Y-m-d');
        $tokoId = $user->id_toko;

        // Total sales revenue (lunas)
        $totalSales = DB::table('transaksi')->where('id_toko', $tokoId)->where('status_pembayaran', 'lunas')->sum('total_biaya') ?? 0;
        // Total purchase expenses (belanja)
        $totalExpense = DB::table('belanja')->where('id_toko', $tokoId)->sum('total_biaya') ?? 0;

        // Cash flow history log (mix sales and purchase transactions)
        $incomes = DB::table('transaksi')
            ->where('id_toko', $tokoId)
            ->where('status_pembayaran', 'lunas')
            ->select('order_id as id', 'tanggal', DB::raw('"Uang Masuk (Penjualan)" as tipe'), 'total_biaya as nominal', 'metode_pembayaran as detail')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->toArray();

        $expenses = DB::table('belanja')
            ->where('id_toko', $tokoId)
            ->select(DB::raw('CONCAT("BELANJA-", id) as id'), 'tanggal', DB::raw('"Uang Keluar (Bahan Baku)" as tipe'), 'total_biaya as nominal', 'catatan as detail')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->toArray();

        // Merge and sort in PHP
        $mutations = array_merge($incomes, $expenses);
        usort($mutations, function($a, $b) {
            return strcmp($b->tanggal, $a->tanggal);
        });
        $mutations = array_slice($mutations, 0, 50);

        // Daily revenue and expense datasets for charting (last 15 days)
        $chartData = [];
        for ($i = 14; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dailyIncome = DB::table('transaksi')
                ->where('id_toko', $tokoId)
                ->where('status_pembayaran', 'lunas')
                ->whereDate('tanggal', $date)
                ->sum('total_biaya') ?? 0;

            $dailyExpense = DB::table('belanja')
                ->where('id_toko', $tokoId)
                ->whereDate('tanggal', $date)
                ->sum('total_biaya') ?? 0;

            $chartData[] = [
                'tanggal' => date('d M', strtotime($date)),
                'pendapatan' => (int)$dailyIncome,
                'pengeluaran' => (int)$dailyExpense,
            ];
        }

        // Calculate menu profitability from both manual and online transactions
        $manualSales = DB::table('transaksi')
            ->select('id_menu', DB::raw('SUM(jumlah) as qty'), DB::raw('SUM(total_biaya) as sales'))
            ->where('id_toko', $tokoId)
            ->where('status_pembayaran', 'lunas')
            ->whereNotNull('id_menu')
            ->groupBy('id_menu');

        $onlineSales = DB::table('transaksi_items')
            ->join('transaksi', 'transaksi_items.order_id', '=', 'transaksi.order_id')
            ->select('transaksi_items.id_menu', DB::raw('SUM(transaksi_items.jumlah) as qty'), DB::raw('SUM(transaksi_items.subtotal) as sales'))
            ->where('transaksi.id_toko', $tokoId)
            ->where('transaksi.status_pembayaran', 'lunas')
            ->groupBy('transaksi_items.id_menu');

        $rawSales = DB::query()
            ->fromSub(function ($query) use ($manualSales, $onlineSales) {
                $query->from($manualSales->unionAll($onlineSales), 'union_sales');
            }, 's')
            ->select('id_menu', DB::raw('SUM(qty) as total_sold'), DB::raw('SUM(sales) as total_sales'))
            ->groupBy('id_menu');

        $menuProfitability = DB::table('menu')
            ->where('menu.id_toko', $tokoId)
            ->leftJoinSub($rawSales, 'sales_sum', 'menu.id', '=', 'sales_sum.id_menu')
            ->select('menu.id', 'menu.nama_menu', 'menu.harga', 'menu.gambar', 
                DB::raw('IFNULL(sales_sum.total_sold, 0) as total_sold'), 
                DB::raw('IFNULL(sales_sum.total_sales, 0) as total_sales')
            )
            ->orderBy('total_sales', 'desc')
            ->limit(4)
            ->get();

        foreach ($menuProfitability as $mp) {
            $sopItems = DB::table('sop')
                ->join('barang', 'sop.id_barang', '=', 'barang.id')
                ->where('sop.id_menu', $mp->id)
                ->select('sop.gramasi', 'barang.harga_beli', 'barang.faktor_konversi')
                ->get();
            
            $hpp = 0.0;
            foreach ($sopItems as $sop) {
                $konversi = (float)$sop->faktor_konversi ?: 1.0;
                $hpp += (float)$sop->gramasi * ((float)$sop->harga_beli / $konversi);
            }
            $mp->hpp = round($hpp, 2);
            $mp->profit_per_cup = max(0.0, $mp->harga - $hpp);
            $mp->total_profit = $mp->total_sold * $mp->profit_per_cup;
        }

        $devPayment = $this->getDevPaymentConfig();
        $freePlanFee = $this->getFreePlanTransactionFee();
        $subTier = $this->getActiveSubscriptionTier($tokoId);

        $buktiTransfers = DB::table('bukti_transfer')
            ->where('id_toko', $tokoId)
            ->orderBy('tanggal', 'desc')
            ->get();

        return Inertia::render('Keuangan', [
            'total_sales' => (int)$totalSales,
            'total_expense' => (int)$totalExpense,
            'mutations' => $mutations,
            'chart_data' => $chartData,
            'menu_profitability' => $menuProfitability,
            'user' => $user,
            'dev_payment' => [
                'bank_name' => $devPayment['bank_name'],
                'no_rekening' => $devPayment['no_rekening'],
                'nama_pemilik' => $devPayment['nama_pemilik'],
                'qris_string' => $devPayment['qris_string'],
            ],
            'subscription_tier' => $subTier,
            'free_plan_fee' => $freePlanFee,
            'bukti_transfers' => $buktiTransfers
        ]);
    }

    public function uploadTransferProof(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'gambar_file' => 'required|image|max:4096'
        ]);

        $tokoId = $user->id_toko;

        // Check if there is already a record for this date
        $exists = DB::table('bukti_transfer')
            ->where('id_toko', $tokoId)
            ->where('tanggal', $request->tanggal)
            ->first();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Anda sudah mengunggah bukti transfer untuk tanggal ini.'], 400);
        }

        $filePath = null;
        if ($request->hasFile('gambar_file')) {
            $file = $request->file('gambar_file');
            $filename = 'transfer_' . $tokoId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/bukti_transfer'), $filename);
            $filePath = 'uploads/bukti_transfer/' . $filename;
        }

        DB::table('bukti_transfer')->insert([
            'id_toko' => $tokoId,
            'tanggal' => $request->tanggal,
            'nominal' => $request->nominal,
            'gambar' => $filePath,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Bukti transfer harian berhasil diunggah!']);
    }

    private function cleanupOldTransferProofs()
    {
        $oldProofs = DB::table('bukti_transfer')
            ->where('created_at', '<', now()->subDays(7))
            ->whereNotNull('gambar')
            ->get();

        foreach ($oldProofs as $proof) {
            $filePath = public_path($proof->gambar);
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
            DB::table('bukti_transfer')
                ->where('id', $proof->id)
                ->update(['gambar' => null]);
        }
    }

    // ============================================================
    // DYNAMIC QRIS GENERATOR (10 MINUTES EXPIRE)
    // ============================================================
    public function generateQris(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
            'amount' => 'required|numeric|min:1',
            'id_toko' => 'nullable|integer'
        ]);

        $orderId = $request->order_id;
        $amount = (float)$request->amount;

        // Determine toko: from request param, from auth user, or fallback
        $tokoId = $request->id_toko;
        if (!$tokoId) {
            $user = $this->getAuthUser();
            $tokoId = $user ? $user->id_toko : 1;
        }

        // Check if QRIS already exists and is still valid
        $existing = DB::table('qris_payments')
            ->where('order_id', $orderId)
            ->where('status', 'pending')
            ->where('expired_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json([
                'success' => true,
                'qr_payload' => $existing->qr_payload,
                'expired_at' => $existing->expired_at,
                'minutes_left' => round((strtotime($existing->expired_at) - time()) / 60, 1)
            ]);
        }

        // Expiry set to 10 minutes from now
        $expiredAt = now()->addMinutes(10);

        // Get admin's QRIS config (static QRIS string from their bank/e-wallet)
        $qrisConfig = DB::table('qris_config')->where('id_toko', $tokoId)->first();
        $staticQris = $qrisConfig->qris_string ?? null;

        $qrPayload = '';
        if ($staticQris && !empty(trim($staticQris))) {
            // Use QRISGenerator to convert admin's static QRIS to dynamic with exact amount
            $qrPayload = \App\Services\QRISGenerator::makeDynamic($staticQris, $amount);
        } else {
            // Fallback: generate generic EMVCo QRIS payload if no static string configured
            $merchantName = $qrisConfig->nama_pemilik ?? 'Toko POS';
            $merchantNameLen = str_pad(strlen($merchantName), 2, '0', STR_PAD_LEFT);
            $amountStr = number_format($amount, 2, '.', '');
            $amountLen = str_pad(strlen($amountStr), 2, '0', STR_PAD_LEFT);
            $qrPayload = "000201010212" 
                . "26380010ID.CO.QRIS.WWW0215ID10200881953170" 
                . "51440014ID.CO.QRIS.WWW0215ID10200881953170" 
                . "52045926530356" 
                . "54" . $amountLen . $amountStr 
                . "5802ID" 
                . "59" . $merchantNameLen . $merchantName 
                . "6007Jakarta" 
                . "6304";
            // Calculate CRC
            $crc = \App\Services\QRISGenerator::crc16($qrPayload);
            $qrPayload .= $crc;
        }

        DB::table('qris_payments')->updateOrInsert(
            ['order_id' => $orderId],
            [
                'nominal' => $amount,
                'qr_payload' => $qrPayload,
                'id_toko' => $tokoId,
                'expired_at' => $expiredAt,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now()
            ]
        );

        return response()->json([
            'success' => true,
            'qr_payload' => $qrPayload,
            'expired_at' => $expiredAt->toDateTimeString(),
            'minutes_left' => 10,
            'merchant_name' => $qrisConfig->nama_pemilik ?? 'Merchant',
            'bank_name' => $qrisConfig->bank_name ?? 'Bank',
            'no_rekening' => $qrisConfig->no_rekening ?? '-'
        ]);
    }

    public function simulateQrisPayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string'
        ]);

        $orderId = $request->order_id;

        // Check if there's a QRIS record for this order
        $qris = DB::table('qris_payments')
            ->where('order_id', $orderId)
            ->first();

        if ($qris) {
            // QRIS-based payment
            if ($qris->status === 'expired' || strtotime($qris->expired_at) < time()) {
                DB::table('qris_payments')->where('order_id', $orderId)->update(['status' => 'expired']);
                return response()->json(['success' => false, 'message' => 'QRIS sudah kedaluwarsa. Silakan generate ulang.'], 400);
            }
            // Set QRIS status to paid
            DB::table('qris_payments')->where('order_id', $orderId)->update(['status' => 'paid']);
        }

        // Verify the transaction exists
        $transaksi = DB::table('transaksi')->where('order_id', $orderId)->first();
        if (!$transaksi) {
            return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan.'], 404);
        }

        // Update main transaction status to lunas
        DB::table('transaksi')->where('order_id', $orderId)->update([
            'status_pembayaran' => 'lunas',
            'status_pesanan' => 'diproses'
        ]);

        $method = $transaksi->metode_pembayaran ?? 'qris';
        $label = $method === 'va' ? 'Virtual Account' : 'QRIS';

        return response()->json([
            'success' => true,
            'message' => "Simulasi pembayaran {$label} berhasil! Status pesanan diupdate menjadi lunas."
        ]);
    }

    // ============================================================
    // BARANG / MATERIAL GUDANG CRUD (Ported from pos_haltea)
    // ============================================================
    public function listBarang(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return redirect()->route('login'); }

        $barangList = DB::table('barang')->orderBy('nama_barang', 'asc')->get();

        // Calculate 30-day average usage
        $dateStr = date('Y-m-d', strtotime('-30 days'));
        $menuSales = DB::table('transaksi')
            ->select('id_menu', DB::raw('SUM(jumlah) as total_qty'))
            ->where('tanggal', '>=', $dateStr)
            ->groupBy('id_menu')
            ->get();

        $salesMap = [];
        foreach ($menuSales as $s) {
            $salesMap[$s->id_menu] = (float)$s->total_qty;
        }

        $sopList = DB::table('sop')->select('id_menu', 'id_barang', 'gramasi')->get();

        $totalUsageMap = [];
        foreach ($sopList as $sop) {
            $menuSalesQty = $salesMap[$sop->id_menu] ?? 0.0;
            $usage = $menuSalesQty * (float)$sop->gramasi;
            if (!isset($totalUsageMap[$sop->id_barang])) {
                $totalUsageMap[$sop->id_barang] = 0.0;
            }
            $totalUsageMap[$sop->id_barang] += $usage;
        }

        $enrichedBarang = [];
        foreach ($barangList as $b) {
            $totalUsage30Days = $totalUsageMap[$b->id] ?? 0.0;
            $avgDailyUsage = $totalUsage30Days / 30.0;

            $L = isset($b->lead_time_hari) ? (int)$b->lead_time_hari : 2;
            $safetyStock = $avgDailyUsage * (isset($b->safety_stock_hari) ? (int)$b->safety_stock_hari : 1);
            $rop = ($avgDailyUsage * $L) + $safetyStock;
            $butuhRestock = (float)$b->stok_gudang <= $rop;

            $estimasiBeli = 0;
            if ($butuhRestock && $avgDailyUsage > 0) {
                $targetStok = ($avgDailyUsage * 7) + $safetyStock;
                $kekurangan = max(0.0, $targetStok - (float)$b->stok_gudang);
                $estimasiBeli = (int)ceil($kekurangan / ((float)$b->faktor_konversi ?: 1.0));
            }

            $enrichedBarang[] = [
                'id' => $b->id,
                'kode_barang' => $b->kode_barang,
                'nama_barang' => $b->nama_barang,
                'satuan' => $b->satuan,
                'satuan_beli' => $b->satuan_beli,
                'satuan_resep' => $b->satuan_resep,
                'faktor_konversi' => (float)$b->faktor_konversi,
                'stok_gudang' => (float)$b->stok_gudang,
                'safety_stock_hari' => (int)$b->safety_stock_hari,
                'lead_time_hari' => (int)$b->lead_time_hari,
                'harga_beli' => (float)$b->harga_beli,
                'avg_daily_usage' => round($avgDailyUsage, 3),
                'rop' => round($rop, 3),
                'butuh_restock' => $butuhRestock,
                'estimasi_beli' => $estimasiBeli
            ];
        }

        if ($request->wantsJson()) {
            return response()->json($enrichedBarang);
        }

        return Inertia::render('StokBahanBaku', [
            'barang' => $enrichedBarang,
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ]
        ]);
    }

    public function storeBarang(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'kode_barang' => 'required|string|unique:barang,kode_barang',
            'nama_barang' => 'required|string',
            'satuan_beli' => 'required|string',
            'satuan_resep' => 'required|string',
            'faktor_konversi' => 'required|numeric|min:0.01',
            'stok_gudang' => 'required|numeric|min:0',
            'safety_stock_hari' => 'required|integer|min:0',
            'lead_time_hari' => 'required|integer|min:0',
            'harga_beli' => 'required|numeric|min:0'
        ]);

        DB::table('barang')->insert([
            'kode_barang' => $request->kode_barang,
            'nama_barang' => $request->nama_barang,
            'satuan' => $request->satuan_beli,
            'satuan_beli' => $request->satuan_beli,
            'satuan_resep' => $request->satuan_resep,
            'faktor_konversi' => $request->faktor_konversi,
            'stok_gudang' => $request->stok_gudang,
            'safety_stock_hari' => $request->safety_stock_hari,
            'lead_time_hari' => $request->lead_time_hari,
            'harga_beli' => $request->harga_beli,
        ]);

        return response()->json(['success' => true, 'message' => 'Bahan baku berhasil ditambahkan.']);
    }

    public function updateBarang(Request $request, $id)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'kode_barang' => 'required|string|unique:barang,kode_barang,' . $id,
            'nama_barang' => 'required|string',
            'satuan_beli' => 'required|string',
            'satuan_resep' => 'required|string',
            'faktor_konversi' => 'required|numeric|min:0.01',
            'stok_gudang' => 'required|numeric|min:0',
            'safety_stock_hari' => 'required|integer|min:0',
            'lead_time_hari' => 'required|integer|min:0',
            'harga_beli' => 'required|numeric|min:0'
        ]);

        DB::table('barang')->where('id', $id)->update([
            'kode_barang' => $request->kode_barang,
            'nama_barang' => $request->nama_barang,
            'satuan' => $request->satuan_beli,
            'satuan_beli' => $request->satuan_beli,
            'satuan_resep' => $request->satuan_resep,
            'faktor_konversi' => $request->faktor_konversi,
            'stok_gudang' => $request->stok_gudang,
            'safety_stock_hari' => $request->safety_stock_hari,
            'lead_time_hari' => $request->lead_time_hari,
            'harga_beli' => $request->harga_beli,
        ]);

        return response()->json(['success' => true, 'message' => 'Bahan baku berhasil diperbarui.']);
    }

    public function deleteBarang($id)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            DB::table('sop')->where('id_barang', $id)->delete();
            DB::table('rekomendasi_belanja')->where('id_barang', $id)->delete();
            DB::table('barang')->where('id', $id)->delete();
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Bahan baku berhasil dihapus.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ============================================================
    // SOP & RECIPE MANAGEMENT (Ported from pos_haltea)
    // ============================================================
    public function listSopPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') { return redirect()->route('login'); }

        $menus = DB::table('menu')->orderBy('nama_menu', 'asc')->get();
        $barang = DB::table('barang')->orderBy('nama_barang', 'asc')->get();

        return Inertia::render('SopTakaran', [
            'menus' => $menus,
            'barang' => $barang,
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ]
        ]);
    }

    public function getSopByMenu($id_menu)
    {
        $rows = DB::table('sop')
            ->join('barang', 'sop.id_barang', '=', 'barang.id')
            ->where('sop.id_menu', $id_menu)
            ->select('sop.*', 'barang.nama_barang', 'barang.satuan', 'barang.kode_barang')
            ->orderBy('barang.nama_barang', 'asc')
            ->get();

        $menu = DB::table('menu')->where('id', $id_menu)->first();
        $harga = $menu ? (int)$menu->harga : 0;

        return response()->json([
            'items' => $rows,
            'harga' => $harga
        ]);
    }

    public function saveSop(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'id_menu' => 'required|integer',
            'items' => 'required|array',
            'harga' => 'required|integer'
        ]);

        $id_menu = $request->id_menu;
        $items = $request->items;
        $harga = $request->harga;

        DB::beginTransaction();
        try {
            DB::table('menu')->where('id', $id_menu)->update(['harga' => $harga]);
            DB::table('sop')->where('id_menu', $id_menu)->delete();

            foreach ($items as $item) {
                $id_barang = (int)$item['id_barang'];
                $gramasi = (float)$item['gramasi'];
                $produk_per_beli = (float)($item['produk_per_beli'] ?? 0);

                if ($gramasi > 0 || $produk_per_beli > 0) {
                    DB::table('sop')->insert([
                        'id_menu' => $id_menu,
                        'id_barang' => $id_barang,
                        'gramasi' => $gramasi,
                        'jml_per_beli' => (float)($item['jml_per_beli'] ?? 0),
                        'produk_per_beli' => $produk_per_beli
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'SOP berhasil disimpan.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ============================================================
    // DATA TRANSAKSI & MANUAL/EXCEL IMPORT (Ported from pos_haltea)
    // ============================================================
    public function listTransaksiPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return redirect()->route('login'); }

        $tanggal = $request->query('tanggal');
        
        $query = DB::table('transaksi')
            ->join('menu', 'transaksi.id_menu', '=', 'menu.id')
            ->select('transaksi.*', 'menu.nama_menu', 'menu.harga')
            ->orderBy('transaksi.created_at', 'desc');

        if ($tanggal) {
            $query->whereDate('transaksi.tanggal', $tanggal);
        }

        $transaksi = $query->limit(100)->get();
        $menus = DB::table('menu')->where('aktif', 1)->orderBy('nama_menu', 'asc')->get();

        if ($request->wantsJson()) {
            return response()->json($transaksi);
        }

        return Inertia::render('DataTransaksi', [
            'transaksi' => $transaksi,
            'menus' => $menus,
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ]
        ]);
    }

    public function storeTransaksi(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'tanggal' => 'required|date',
            'items' => 'required|array'
        ]);

        $tanggal = $request->tanggal;
        $items = $request->items;

        DB::beginTransaction();
        try {
            foreach ($items as $item) {
                $menuId = (int)$item['id_menu'];
                $jumlah = (int)$item['jumlah'];

                $menu = DB::table('menu')->where('id', $menuId)->first();
                if (!$menu) {
                    throw new \Exception('Menu tidak ditemukan.');
                }

                DB::table('transaksi')->insert([
                    'tanggal' => $tanggal,
                    'id_menu' => $menuId,
                    'jumlah' => $jumlah,
                    'total_biaya' => $menu->harga * $jumlah,
                    'status_pembayaran' => 'lunas',
                    'status_pesanan' => 'selesai',
                    'sumber' => 'manual',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                // Deduct stock if SOP exists
                $this->deductStock($menuId, $jumlah);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Transaksi berhasil dicatat.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteTransaksi($id)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::table('transaksi')->where('id', $id)->delete();
        return response()->json(['success' => true, 'message' => 'Transaksi berhasil dihapus.']);
    }

    public function importTransaksi(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'csv' => 'required|string',
            'potongStok' => 'required|boolean'
        ]);

        $csvText = $request->csv;
        $potongStok = $request->potongStok;

        $lines = preg_split('/\r\n|\r|\n/', trim($csvText));
        if (count($lines) < 2) {
            return response()->json(['success' => false, 'message' => 'Format CSV tidak valid.'], 400);
        }

        $headers = str_getcsv($lines[0]);
        $colMap = [];
        foreach ($headers as $idx => $h) {
            $hClean = strtolower(trim($h));
            if ($hClean === 'tanggal') $colMap['tanggal'] = $idx;
            elseif (in_array($hClean, ['nama menu', 'menu', 'nama_menu'])) $colMap['menu'] = $idx;
            elseif (in_array($hClean, ['jumlah', 'qty', 'qty_cup'])) $colMap['jumlah'] = $idx;
        }

        if (!isset($colMap['tanggal']) || !isset($colMap['menu']) || !isset($colMap['jumlah'])) {
            return response()->json(['success' => false, 'message' => 'Header CSV harus berisi kolom "Tanggal", "Nama Menu", dan "Jumlah".'], 400);
        }

        $menuList = DB::table('menu')->get();
        $menuLookup = [];
        foreach ($menuList as $m) {
            $menuLookup[strtolower(trim($m->nama_menu))] = $m->id;
        }

        $errors = [];
        $validRows = [];

        for ($i = 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) continue;

            $row = str_getcsv($line);
            $rowNum = $i + 1;
            $rowErrors = [];

            $maxIdx = max($colMap);
            if (count($row) <= $maxIdx) {
                $errors[] = ['row' => $rowNum, 'error' => 'Jumlah kolom tidak sesuai.'];
                continue;
            }

            $rawDate = trim($row[$colMap['tanggal']]);
            $rawMenu = trim($row[$colMap['menu']]);
            $rawQty = trim($row[$colMap['jumlah']]);

            // Validate Date
            $parsedDate = \DateTime::createFromFormat('Y-m-d', $rawDate);
            if (!$parsedDate || $parsedDate->format('Y-m-d') !== $rawDate) {
                $rowErrors[] = 'Format tanggal salah: "' . $rawDate . '". Gunakan YYYY-MM-DD.';
            }

            // Validate Menu
            $menuId = null;
            if (empty($rawMenu)) {
                $rowErrors[] = 'Nama menu kosong.';
            } else {
                $menuClean = strtolower($rawMenu);
                if (isset($menuLookup[$menuClean])) {
                    $menuId = $menuLookup[$menuClean];
                } else {
                    $rowErrors[] = 'Menu tidak dikenali: "' . $rawMenu . '".';
                }
            }

            // Validate Qty
            $parsedQty = 0;
            if (empty($rawQty)) {
                $rowErrors[] = 'Jumlah kosong.';
            } else {
                $qtyNum = (int)$rawQty;
                if ($qtyNum <= 0) {
                    $rowErrors[] = 'Jumlah tidak valid: "' . $rawQty . '".';
                } else {
                    $parsedQty = $qtyNum;
                }
            }

            if (!empty($rowErrors)) {
                $errors[] = ['row' => $rowNum, 'error' => implode(' ', $rowErrors)];
            } else {
                $validRows[] = [
                    'tanggal' => $rawDate,
                    'menuId' => $menuId,
                    'jumlah' => $parsedQty
                ];
            }
        }

        if (!empty($errors)) {
            return response()->json(['success' => false, 'message' => 'Impor dibatalkan. Ditemukan kesalahan.', 'errors' => $errors], 400);
        }

        DB::beginTransaction();
        try {
            foreach ($validRows as $row) {
                $menu = DB::table('menu')->where('id', $row['menuId'])->first();
                DB::table('transaksi')->insert([
                    'tanggal' => $row['tanggal'],
                    'id_menu' => $row['menuId'],
                    'jumlah' => $row['jumlah'],
                    'total_biaya' => $menu->harga * $row['jumlah'],
                    'status_pembayaran' => 'lunas',
                    'status_pesanan' => 'selesai',
                    'sumber' => 'import',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                if ($potongStok) {
                    $this->deductStock($row['menuId'], $row['jumlah']);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Berhasil mengimpor ' . count($validRows) . ' data transaksi.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ============================================================
    // LIHAT PREDIKSI (Ported from pos_haltea)
    // ============================================================
    public function listPrediksiPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) { return redirect()->route('login'); }

        $prediksi = DB::table('hasil_prediksi')->where('id_toko', $user->id_toko)->orderBy('nama_menu', 'asc')->get();

        $rekomendasi = DB::table('rekomendasi_belanja as rb')
            ->join('barang as b', 'rb.id_barang', '=', 'b.id')
            ->where('rb.id_toko', $user->id_toko)
            ->select('b.id as id_barang', 'b.nama_barang', 'b.satuan', 'b.satuan_beli', 'b.faktor_konversi', 'b.stok_gudang', DB::raw('SUM(rb.prediksi_kebutuhan) as total_kebutuhan'), DB::raw('SUM(rb.safety_stock) as total_safety'))
            ->groupBy('b.id', 'b.nama_barang', 'b.satuan', 'b.satuan_beli', 'b.faktor_konversi', 'b.stok_gudang')
            ->get();

        foreach ($rekomendasi as $r) {
            $r->avg_daily_usage = $r->total_kebutuhan / 7.0;
            $r->rop = ($r->avg_daily_usage * 2) + $r->total_safety; // L = 2
            $r->butuh_restock = $r->stok_gudang <= $r->rop;
            
            $r->estimasi_beli = 0;
            if ($r->butuh_restock && $r->avg_daily_usage > 0) {
                $targetStok = ($r->avg_daily_usage * 7) + $r->total_safety;
                $kekurangan = max(0.0, $targetStok - $r->stok_gudang);
                $r->estimasi_beli = (int)ceil($kekurangan / ((float)$r->faktor_konversi ?: 1.0));
            }
        }

        $barangList = DB::table('barang')->where('id_toko', $user->id_toko)->orderBy('nama_barang', 'asc')->get();

        return Inertia::render('LihatPrediksi', [
            'prediksi' => $prediksi,
            'rekomendasi' => $rekomendasi,
            'barang' => $barangList,
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
                'id_toko' => $user->id_toko
            ]
        ]);

    }

    // ============================================================
    // SETTINGS / CONFIGURATION (ADMIN)
    // ============================================================
    public function pengaturanPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || !in_array($user->role, ['admin', 'karyawan'])) {
            return redirect()->route('login');
        }

        $qris = DB::table('qris_config')->where('id_toko', $user->id_toko)->first();

        $totalScan = DB::table('transaksi')->where('id_toko', $user->id_toko)->where('metode_pembayaran', 'qris')->count();
        $totalQrisVolume = DB::table('transaksi')
            ->where('id_toko', $user->id_toko)
            ->where('metode_pembayaran', 'qris')
            ->where('status_pembayaran', 'lunas')
            ->sum('total_biaya') ?? 0;

        $tokoId = $user->id_toko;
        $notifKeys = [
            'notif_pesanan_masuk' => 'toko_' . $tokoId . '_notif_pesanan_masuk',
            'notif_pembayaran_diterima' => 'toko_' . $tokoId . '_notif_pembayaran_diterima',
            'notif_stok_menipis' => 'toko_' . $tokoId . '_notif_stok_menipis',
            'notif_absensi_karyawan' => 'toko_' . $tokoId . '_notif_absensi_karyawan',
        ];

        $notifSettings = [];
        foreach ($notifKeys as $cleanKey => $dbKey) {
            $metaVal = DB::table('meta')->where('key', $dbKey)->first();
            if ($metaVal) {
                $notifSettings[$cleanKey] = $metaVal->value === '1';
            } else {
                $notifSettings[$cleanKey] = in_array($cleanKey, ['notif_pesanan_masuk', 'notif_pembayaran_diterima']);
            }
        }

        return Inertia::render('Pengaturan', [
            'qris' => $qris,
            'stats' => [
                'total_scan' => $totalScan,
                'total_volume' => (int)$totalQrisVolume
            ],
            'notifSettings' => $notifSettings,
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ]
        ]);
    }

    public function updateQrisConfig(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nama_pemilik' => 'required|string|max:100',
            'bank_name' => 'required|string|max:50',
            'no_rekening' => 'required|string|max:50',
            'tipe_qris' => 'required|string|in:statis,dinamis',
            'qris_string' => 'nullable|string',
        ]);

        $updateData = [
            'nama_pemilik' => $request->nama_pemilik,
            'bank_name' => $request->bank_name,
            'no_rekening' => $request->no_rekening,
            'tipe_qris' => $request->tipe_qris,
            'qris_string' => $request->qris_string,
        ];

        if ($request->hasFile('qris_image')) {
            $updateData['image_path'] = $this->compressImage($request->file('qris_image'), 'uploads', 'qris_manual');
        }

        DB::table('qris_config')->updateOrInsert(
            ['id_toko' => $user->id_toko],
            $updateData
        );

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi QRIS berhasil disimpan!'
        ]);
    }

    // ============================================================
    // LIVE FIFO QUEUE (CUSTOMER & CASHIER)
    // ============================================================
    public function pembeliAntrian(Request $request)
    {
        $sessionId = $request->query('session_id');
        $tokoId = $request->query('id_toko', 1);
        $toko = DB::table('toko')->where('id', $tokoId)->first();
        $qris = DB::table('qris_config')->where('id_toko', $tokoId)->first();
        return Inertia::render('Antrian', [
            'session_id' => $sessionId,
            'id_toko' => (int)$tokoId,
            'merchant_name' => $toko->nama_toko ?? ($qris->nama_pemilik ?? 'Toko UMKM')
        ]);
    }

    public function getLiveAntrian(Request $request)
    {
        $today = now()->format('Y-m-d');
        $tokoId = $request->query('id_toko', 1);
        
        $active = DB::table('transaksi')
            ->where('id_toko', $tokoId)
            ->where('tanggal', 'like', $today . '%')
            ->whereIn('status_pesanan', ['dipesan', 'diproses', 'siap'])
            ->orderBy('created_at', 'asc')
            ->select('order_id', 'nomor_antrian', 'nama_pembeli', 'status_pesanan', 'status_pembayaran', 'created_at')
            ->get();

        $completed = DB::table('transaksi')
            ->where('id_toko', $tokoId)
            ->where('tanggal', 'like', $today . '%')
            ->where('status_pesanan', 'selesai')
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->select('order_id', 'nomor_antrian', 'nama_pembeli', 'status_pesanan', 'status_pembayaran', 'updated_at')
            ->get();

        return response()->json([
            'active' => $active,
            'completed' => $completed
        ]);
    }

    // ============================================================
    // WAREHOUSE DECREMENT STOCK HELPER
    // ============================================================
    private function deductStock($menuId, $qty)
    {
        $sops = DB::table('sop')->where('id_menu', $menuId)->get();
        foreach ($sops as $sop) {
            $barang = DB::table('barang')->where('id', $sop->id_barang)->first();
            if ($barang && (float)$barang->faktor_konversi > 0) {
                $decrementAmount = ($sop->gramasi * $qty) / (float)$barang->faktor_konversi;
                DB::table('barang')->where('id', $sop->id_barang)->decrement('stok_gudang', $decrementAmount);
            }
        }
    }

    // ============================================================
    // ABSENSI STAFF & ADMIN ACTIONS
    // ============================================================
    public function absensiPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return redirect()->route('login');
        }

        $config = DB::table('absensi_config')->where('id_toko', $user->id_toko)->first();
        if (!$config) {
            // create default if missing
            DB::table('absensi_config')->insert([
                'id_toko' => $user->id_toko,
                'jam_masuk' => '08:00:00',
                'jam_pulang' => '17:00:00',
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $config = DB::table('absensi_config')->where('id_toko', $user->id_toko)->first();
        }
        $today = now()->format('Y-m-d');

        if ($user->role === 'admin') {
            $logs = DB::table('absensi')
                ->join('users', 'absensi.id_user', '=', 'users.id')
                ->where('users.id_toko', $user->id_toko)
                ->select('absensi.*', 'users.nama as nama_staff', 'users.username')
                ->orderBy('absensi.tanggal', 'desc')
                ->orderBy('absensi.created_at', 'desc')
                ->get();

            $staffs = DB::table('users')
                ->where('id_toko', $user->id_toko)
                ->where('role', '!=', 'admin')
                ->get();

            return Inertia::render('Absensi', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->nama,
                    'role' => $user->role,
                    'id_toko' => $user->id_toko
                ],
                'config' => $config,
                'logs' => $logs,
                'staffs' => $staffs,
                'today' => $today
            ]);
        } else {
            $todayLog = DB::table('absensi')
                ->where('id_user', $user->id)
                ->where('tanggal', $today)
                ->first();

            $history = DB::table('absensi')
                ->where('id_user', $user->id)
                ->orderBy('tanggal', 'desc')
                ->limit(30)
                ->get();

            return Inertia::render('Absensi', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->nama,
                    'role' => $user->role,
                    'id_toko' => $user->id_toko
                ],
                'config' => $config,
                'today_log' => $todayLog,
                'history' => $history,
                'today' => $today
            ]);
        }
    }

    public function checkinAbsensi(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'foto_masuk' => 'required|image|max:5120'
        ]);

        $config = DB::table('absensi_config')->where('id_toko', $user->id_toko)->first();
        $today = now()->format('Y-m-d');
        $nowTime = now()->format('H:i:s');

        // Check if already checked in today
        $existing = DB::table('absensi')->where('id_user', $user->id)->where('tanggal', $today)->first();
        if ($existing && $existing->status === 'hadir') {
            return response()->json(['success' => false, 'message' => 'Anda sudah absen masuk hari ini.']);
        }

        $isLate = ($config && $nowTime > $config->jam_masuk) ? 'terlambat' : 'tepat_waktu';

        // Process Upload
        $file = $request->file('foto_masuk');
        $imagePath = $this->compressImage($file, 'uploads/absensi', 'absen_masuk_' . $user->id);

        DB::table('absensi')->updateOrInsert(
            ['id_user' => $user->id, 'tanggal' => $today],
            [
                'id_toko' => $user->id_toko,
                'status' => 'hadir',
                'jam_masuk' => $nowTime,
                'foto_masuk' => $imagePath,
                'keterangan_masuk' => $isLate,
                'updated_at' => now()
            ]
        );

        return response()->json(['success' => true, 'message' => 'Absen masuk berhasil! Status: ' . ($isLate === 'terlambat' ? 'Terlambat' : 'Tepat Waktu')]);
    }

    public function checkoutAbsensi(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $today = now()->format('Y-m-d');
        $nowTime = now()->format('H:i:s');

        $existing = DB::table('absensi')->where('id_user', $user->id)->where('tanggal', $today)->first();
        if (!$existing || $existing->status !== 'hadir') {
            return response()->json(['success' => false, 'message' => 'Anda harus absen masuk terlebih dahulu.']);
        }

        if ($existing->jam_pulang) {
            return response()->json(['success' => false, 'message' => 'Anda sudah absen pulang hari ini.']);
        }

        $config = DB::table('absensi_config')->where('id_toko', $user->id_toko)->first();
        $isEarly = ($config && $nowTime < $config->jam_pulang) ? 'cepat' : 'tepat_waktu';

        DB::table('absensi')
            ->where('id_user', $user->id)
            ->where('tanggal', $today)
            ->update([
                'jam_pulang' => $nowTime,
                'keterangan_pulang' => $isEarly,
                'updated_at' => now()
            ]);

        return response()->json(['success' => true, 'message' => 'Absen pulang berhasil! Status: ' . ($isEarly === 'cepat' ? 'Pulang Cepat (Terlambat Pulang)' : 'Tepat Waktu')]);
    }

    public function permitAbsensi(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'alasan_izin' => 'required|string|max:1000'
        ]);

        $today = now()->format('Y-m-d');

        DB::table('absensi')->updateOrInsert(
            ['id_user' => $user->id, 'tanggal' => $today],
            [
                'id_toko' => $user->id_toko,
                'status' => 'izin',
                'alasan_izin' => $request->alasan_izin,
                'updated_at' => now()
            ]
        );

        return response()->json(['success' => true, 'message' => 'Permohonan izin berhasil dikirim!']);
    }

    public function updateAbsensiConfig(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'jam_masuk' => 'required|string',
            'jam_pulang' => 'required|string'
        ]);

        DB::table('absensi_config')->updateOrInsert(
            ['id_toko' => $user->id_toko],
            [
                'jam_masuk' => $request->jam_masuk,
                'jam_pulang' => $request->jam_pulang,
                'updated_at' => now()
            ]
        );

        return response()->json(['success' => true, 'message' => 'Konfigurasi absensi berhasil diperbarui!']);
    }

    // ============================================================
    // IMAGE COMPRESSION HELPER
    // ============================================================
    private function compressImage($file, $destinationFolder, $filenamePrefix)
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = $filenamePrefix . '_' . time() . '.' . $extension;
        $destinationPath = public_path($destinationFolder);
        
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        
        $targetFile = $destinationPath . '/' . $filename;
        
        if (extension_loaded('gd')) {
            $image = null;
            if ($extension === 'jpg' || $extension === 'jpeg') {
                $image = @imagecreatefromjpeg($file->getRealPath());
                if ($image) {
                    imagejpeg($image, $targetFile, 70); // 70% quality (clear but lightweight)
                    imagedestroy($image);
                    return $destinationFolder . '/' . $filename;
                }
            } elseif ($extension === 'png') {
                $image = @imagecreatefrompng($file->getRealPath());
                if ($image) {
                    imagealphablending($image, false);
                    imagesavealpha($image, true);
                    imagepng($image, $targetFile, 6); // level 6 compression
                    imagedestroy($image);
                    return $destinationFolder . '/' . $filename;
                }
            } elseif ($extension === 'webp') {
                $image = @imagecreatefromwebp($file->getRealPath());
                if ($image) {
                    imagewebp($image, $targetFile, 70); // 70% quality webp
                    imagedestroy($image);
                    return $destinationFolder . '/' . $filename;
                }
            }
        }
        
        // Fallback: move file normally
        $file->move($destinationPath, $filename);
        return $destinationFolder . '/' . $filename;
    }

    // ============================================================
    // STAFF / KARYAWAN MANAGEMENT (ADMIN)
    // ============================================================
    public function listStaffPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return redirect()->route('login');
        }

        $staffs = DB::table('users')
            ->where('id_toko', $user->id_toko)
            ->where('role', 'karyawan')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('KelolaKaryawan', [
            'user' => [
                'id' => $user->id,
                'name' => $user->nama,
                'role' => $user->role,
                'id_toko' => $user->id_toko
            ],
            'staffs' => $staffs
        ]);
    }

    public function storeStaff(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nama' => 'required|string|max:255',
            'username' => 'required|string|unique:users,username|max:255',
            'password' => 'required|string|min:6',
        ]);

        DB::table('users')->insert([
            'nama' => $request->nama,
            'username' => $request->username,
            'password' => password_hash($request->password, PASSWORD_BCRYPT),
            'role' => 'karyawan',
            'id_toko' => $user->id_toko,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Akun Karyawan berhasil dibuat!']);
    }

    public function deleteStaff(Request $request, $id)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $deleted = DB::table('users')
            ->where('id', $id)
            ->where('id_toko', $user->id_toko)
            ->where('role', 'karyawan')
            ->delete();

        if ($deleted) {
            return response()->json(['success' => true, 'message' => 'Karyawan berhasil dihapus.']);
        }
        return response()->json(['success' => false, 'message' => 'Karyawan tidak ditemukan.'], 404);
    }

    // ============================================================
    // TOKO PROFILE MANAGEMENT (ADMIN)
    // ============================================================
    public function tokoProfilePage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return redirect()->route('login');
        }

        $toko = DB::table('toko')->where('id', $user->id_toko)->first();

        return Inertia::render('ProfilToko', [
            'user' => [
                'id' => $user->id,
                'name' => $user->nama,
                'role' => $user->role,
                'id_toko' => $user->id_toko
            ],
            'toko' => $toko
        ]);
    }

    public function updateTokoProfile(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'nama_toko' => 'required|string|max:255',
            'deskripsi' => 'nullable|string',
            'alamat' => 'nullable|string',
            'kota' => 'nullable|string|max:100',
            'provinsi' => 'nullable|string|max:100',
            'kecamatan' => 'nullable|string|max:150',
            'kelurahan' => 'nullable|string|max:150',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'jam_buka' => 'required|string',
            'jam_tutup' => 'required|string',
            'logo_file' => 'nullable|image|max:5120',
            'sampul_file' => 'nullable|image|max:5120',
            'is_active' => 'nullable'
        ]);

        $updateData = [
            'nama_toko' => $request->nama_toko,
            'deskripsi' => $request->deskripsi,
            'alamat' => $request->alamat,
            'kota' => $request->kota,
            'provinsi' => $request->provinsi,
            'kecamatan' => $request->kecamatan,
            'kelurahan' => $request->kelurahan,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'jam_buka' => $request->jam_buka,
            'jam_tutup' => $request->jam_tutup,
            'is_active' => $request->input('is_active') === '1' || $request->input('is_active') === 'true' || $request->input('is_active') === 1 ? 1 : 0,
            'updated_at' => now(),
        ];

        if ($request->hasFile('logo_file')) {
            $updateData['logo'] = $this->compressImage($request->file('logo_file'), 'uploads/toko', 'logo_' . $user->id_toko);
        }

        if ($request->hasFile('sampul_file')) {
            $updateData['foto_sampul'] = $this->compressImage($request->file('sampul_file'), 'uploads/toko', 'sampul_' . $user->id_toko);
        } elseif ($request->input('remove_sampul') === '1') {
            $currentToko = DB::table('toko')->where('id', $user->id_toko)->first();
            if ($currentToko && $currentToko->foto_sampul && file_exists(public_path($currentToko->foto_sampul))) {
                @unlink(public_path($currentToko->foto_sampul));
            }
            $updateData['foto_sampul'] = null;
        }

        DB::table('toko')->where('id', $user->id_toko)->update($updateData);

        return response()->json(['success' => true, 'message' => 'Profil Toko berhasil diperbarui!']);
    }

    // ============================================================
    // PEMBELI EXPLORE / FIND SHOP
    // ============================================================
    public function pembeliExplore(Request $request)
    {
        return Inertia::render('PembeliExplore');
    }

    public function apiNearbyToko(Request $request)
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if (!$lat || !$lng) {
            return response()->json(['success' => false, 'message' => 'Koordinat GPS diperlukan'], 400);
        }

        // Haversine formula to compute distance in km, ordered closest-first, capped at 20km
        $tokos = DB::table('toko')
            ->select(DB::raw("toko.*, 
                (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance"))
            ->setBindings([$lat, $lng, $lat])
            ->where('is_active', 1)
            ->orderBy('distance', 'asc')
            ->get()
            ->filter(function ($t) {
                return (float)$t->distance <= 20.0;
            })
            ->values();

        return response()->json([
            'success' => true,
            'tokos' => $tokos
        ]);
    }

    public function apiSearchToko(Request $request)
    {
        $search = $request->query('search');
        $provinsi = $request->query('provinsi');
        $kota = $request->query('kota');
        $kecamatan = $request->query('kecamatan');
        $kelurahan = $request->query('kelurahan');

        $query = DB::table('toko')->where('is_active', 1);

        if ($search) {
            $query->where('nama_toko', 'like', '%' . $search . '%');
        }

        if ($provinsi) {
            $query->where('provinsi', 'like', '%' . $provinsi . '%');
        }

        if ($kota) {
            $query->where('kota', 'like', '%' . $kota . '%');
        }

        if ($kecamatan) {
            $query->where('kecamatan', 'like', '%' . $kecamatan . '%');
        }

        if ($kelurahan) {
            $query->where('kelurahan', 'like', '%' . $kelurahan . '%');
        }

        $tokos = $query->orderBy('nama_toko', 'asc')->get();

        return response()->json([
            'success' => true,
            'tokos' => $tokos
        ]);
    }

    public function pembeliTokoProfile(Request $request, $id)
    {
        $toko = DB::table('toko')->where('id', $id)->first();
        if (!$toko) {
            return redirect()->route('pembeli.explore');
        }

        $waMeta = DB::table('meta')->where('key', 'toko_' . $id . '_no_wa')->first();
        $waNumber = $waMeta ? $waMeta->value : null;

        $staffs = DB::table('users')
            ->where('id_toko', $id)
            ->where('role', 'karyawan')
            ->select('nama', 'username')
            ->get();

        return Inertia::render('PembeliTokoProfile', [
            'toko' => $toko,
            'wa_number' => $waNumber,
            'staffs' => $staffs
        ]);
    }

    // ============================================================
    // KASIR ORDER STATUS HANDLERS
    // ============================================================
    public function acceptOrder(Request $request, $orderId)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::table('transaksi')
            ->where('order_id', $orderId)
            ->where('id_toko', $user->id_toko)
            ->update([
                'status_pesanan' => 'diproses',
                'updated_at' => now()
            ]);

        return response()->json(['success' => true, 'message' => 'Pesanan telah diterima dan sedang dibuat.']);
    }

    public function completeOrder(Request $request, $orderId)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::table('transaksi')
            ->where('order_id', $orderId)
            ->where('id_toko', $user->id_toko)
            ->update([
                'status_pesanan' => 'selesai',
                'updated_at' => now()
            ]);

        return response()->json(['success' => true, 'message' => 'Pesanan telah siap dan otomatis dipindahkan ke riwayat pesanan.']);
    }

    // ============================================================
    // CHANGE PASSWORD (WITH OLD PASSWORD VERIFICATION)
    // ============================================================
    public function changePassword(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        // Verify old password
        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Password lama yang Anda masukkan salah.'], 422);
        }

        DB::table('users')->where('id', $user->id)->update([
            'password' => Hash::make($request->new_password),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Password berhasil diubah! Silakan login ulang dengan password baru.']);
    }

    // ============================================================
    // AI ASSISTANT CHATBOT (ROLE-BASED CONTEXTUAL HELP)
    // ============================================================
    public function assistantChat(Request $request)
    {
        $user = $this->getAuthUser();
        $role = $user ? $user->role : 'pembeli';
        $message = strtolower(trim($request->input('message', '')));

        // Guard against security/admin credentials queries
        if (preg_match('/(keamanan|database|password|sandi|security|credential|kredensial|token|env|hack|sql|server|akses.?admin|db_)/', $message)) {
            return response()->json([
                'success' => true,
                'reply' => '🔒 **Sistem Keamanan Aktif**\n\nMaaf, demi keamanan sistem CuanGO, saya tidak diperkenankan memberikan informasi terkait kredensial database, password admin, file konfigurasi .env, atau akses server internal.\n\nJika Anda membutuhkan bantuan operasional, silakan tanyakan panduan cara menggunakan fitur di dashboard ini!'
            ]);
        }

        $reply = '';

        if ($role === 'admin') {
            if (preg_match('/(menu|gambar|foto|produk|tambah)/', $message)) {
                $reply = '📋 **PANDUAN KELOLA PRODUK & DAFTAR MENU (STEP-BY-STEP):**\n\n' .
                         '1. Buka menu **Kelola Menu** di sidebar sebelah kiri.\n' .
                         '2. **Tambah Produk Baru**:\n' .
                         '   • Klik tombol **[+ Tambah Menu]** di kanan atas.\n' .
                         '   • Isi nama menu, harga, deskripsi, dan upload gambar/foto menu.\n' .
                         '   • Klik **[Simpan]**. Gambar akan otomatis ter-crop dan dikompresi agar loading cepat.\n' .
                         '3. **Edit Produk**:\n' .
                         '   • Klik tombol edit ✏️ pada item menu yang ingin diperbarui.\n' .
                         '   • Ubah nama, harga, atau ganti foto baru. Klik **[Simpan Perubahan]**.\n' .
                         '4. **Nonaktifkan Menu**:\n' .
                         '   • Geser toggle status hijau menjadi abu-abu untuk menyembunyikan menu dari pembeli sementara waktu (misal stok habis).';
            } elseif (preg_match('/(prediksi|ses|forecast|hitung|estimasi|rop|safety|gudang)/', $message)) {
                $reply = '📊 **PANDUAN PREDIKSI SES & KEBUTUHAN BAHAN BAKU:**\n\n' .
                         'Sistem menggunakan metode Single Exponential Smoothing (SES) untuk menghitung kebutuhan bahan baku Anda secara otomatis.\n\n' .
                         '**Langkah Penggunaan:**\n' .
                         '1. Buka menu **Lihat Prediksi** di sidebar.\n' .
                         '2. Klik tombol **[Kalkulasi Prediksi SES]** di kanan atas. Sistem akan menganalisis riwayat transaksi penjualan.\n' .
                         '3. Tab **"Hasil Prediksi Menu"** menampilkan estimasi jumlah cup yang akan terjual minggu depan.\n' .
                         '4. Tab **"Ceklist & Catat Belanja"** menampilkan rekomendasi belanja bahan baku berdasarkan takaran resep (SOP) Anda.\n' .
                         '5. Anda dapat mencentang item, menyesuaikan **Jumlah Real** dan mengisi **Harga Satuan** belanjaan Anda, lalu klik **[Simpan & Tambah Stok]** untuk mengupdate stok gudang dan mencatatnya ke laporan keuangan otomatis!';
            } elseif (preg_match('/(karyawan|kasir|staff|pegawai|tambah)/', $message)) {
                $reply = '👥 **PANDUAN KELOLA AKUN KARYAWAN/KASIR:**\n\n' .
                         'Sebagai admin, Anda dapat membuat akun login khusus untuk staf kasir Anda.\n\n' .
                         '**Langkah Penggunaan:**\n' .
                         '1. Buka menu **Kelola Karyawan** di sidebar.\n' .
                         '2. Klik tombol **[+ Tambah Karyawan]**.\n' .
                         '3. Masukkan **Username/Email** dan **Password** baru untuk kasir. Klik **[Simpan Karyawan]**.\n' .
                         '4. Berikan username & password tersebut kepada staf Anda untuk login di halaman depan.\n' .
                         '5. Jika ingin menghapus hak akses karyawan, klik tombol **Hapus** 🗑️ pada daftar staf.';
            } elseif (preg_match('/(keuangan|laba|rugi|laporan|pendapatan|pengeluaran|arus.?kas|cash)/', $message)) {
                $reply = '💰 **PANDUAN LAPORAN KEUANGAN & ARUS KAS:**\n\n' .
                         'Dashboard keuangan diperbarui secara real-time dari transaksi kasir dan belanja bahan baku.\n\n' .
                         '**Informasi yang Ditampilkan:**\n' .
                         '• **Total Pemasukan**: Jumlah nominal dari transaksi penjualan status "Lunas".\n' .
                         '• **Total Pengeluaran**: Jumlah belanja bahan baku yang dicatat lewat menu Prediksi Belanja.\n' .
                         '• **Arus Kas (Mutasi)**: Log uang masuk (Penjualan) dan uang keluar (Belanja) berurutan.\n' .
                         '• **Grafik Penjualan**: Tren omset harian dalam 15 hari terakhir.\n' .
                         '• **Profitabilitas Menu**: Mengetahui menu produk mana yang menyumbang keuntungan bersih terbesar.';
            } elseif (preg_match('/(qris|pembayaran|bayar|konfigurasi|dinamis|statis)/', $message)) {
                $reply = '💳 **PANDUAN PENGATURAN QRIS OTOMATIS (DINAMIS & STATIS):**\n\n' .
                         '1. Buka menu **Pengaturan** di sidebar.\n' .
                         '2. Pada tab **Konfigurasi QRIS**:\n' .
                         '   • Masukkan nama pemilik QRIS, bank penerima, dan nomor rekening.\n' .
                         '   • Pilih **Tipe QRIS**: *Statis* (menggunakan gambar QR code tetap) atau *Dinamis* (sistem menghasilkan kode QR unik per transaksi).\n' .
                         '   • Upload foto QR Code Anda jika bertipe Statis.\n' .
                         '3. Klik **[Simpan Konfigurasi QRIS]** di bawah agar pembeli bisa melakukan scan saat checkout.';
            } elseif (preg_match('/(toko|profil|alamat|lokasi|wilayah|peta|maps|buka|tutup|operasional)/', $message)) {
                $reply = '🏪 **PANDUAN PENGATURAN PROFIL TOKO & JAM OPERASIONAL:**\n\n' .
                         'Informasi ini penting agar pembeli mengetahui lokasi toko Anda dan jam buka-tutup pemesanan.\n\n' .
                         '**Langkah Pengaturan:**\n' .
                         '1. Buka menu **Profil Toko** di sidebar.\n' .
                         '2. Isi nama outlet, deskripsi singkat, alamat lengkap, serta jam buka dan jam tutup.\n' .
                         '3. Pilih wilayah secara bertingkat: **Provinsi → Kabupaten/Kota → Kecamatan → Kelurahan**.\n' .
                         '4. Atur **Titik Lokasi GPS**:\n' .
                         '   • Klik tombol **[Deteksi GPS Saya]** (memerlukan koneksi HTTPS/localhost).\n' .
                         '   • Atau geser pin merah pada peta / klik peta secara langsung untuk menetapkan koordinat latitude/longitude.\n' .
                         '5. Upload Logo & Foto Sampul Toko (bisa dicrop 16:9), lalu klik **[Perbarui Profil Toko]**.';
            } elseif (preg_match('/(printer|cetak|print|struk|nota|bluetooth|usb)/', $message)) {
                $reply = '🖨️ **PANDUAN INTEGRASI PRINTER THERMAL & NOTA KASIR:**\n\n' .
                         '1. Buka menu **Pengaturan** di sidebar, masuk ke tab **Printer POS**.\n' .
                         '2. Pilih tipe koneksi printer Anda (*Bluetooth* atau *USB*).\n' .
                         '3. Klik tombol **[Sambungkan]** dan pilih nama printer Anda yang terdeteksi di daftar pairing.\n' .
                         '4. Klik **[Test Print]** untuk memastikan sambungan berjalan dengan baik.\n' .
                         '5. Setelah tersambung, kasir dapat langsung mencetak struk belanja thermal di halaman POS Terminal atau halaman Verifikasi Antrean.';
            } else {
                $reply = '👋 **Halo Admin!** Saya asisten AI CuanGO. Silakan tanyakan cara mengoperasikan fitur-fitur berikut secara step-by-step:\n\n' .
                         '• 📋 **menu** - Cara tambah/edit produk & gambar\n' .
                         '• 📊 **prediksi** - Perhitungan SES & belanja bahan baku\n' .
                         '• 👥 **karyawan** - Membuat akun login kasir/staff\n' .
                         '• 💰 **keuangan** - Laporan laba rugi & pengeluaran kas\n' .
                         '• 💳 **qris** - Pengaturan QRIS Statis/Dinamis untuk pembeli\n' .
                         '• 🏪 **toko** - Konfigurasi jam operasional, wilayah & GPS\n' .
                         '• 🖨️ **printer** - Sambungan printer thermal USB/Bluetooth\n\n' .
                         'Ketik salah satu kata kunci di atas untuk panduan lengkap!';
            }
        } elseif ($role === 'karyawan' || $role === 'kasir') {
            if (preg_match('/(order|pesanan|transaksi|verifikasi|terima|dapur|status)/', $message)) {
                $reply = '📦 **PANDUAN VERIFIKASI PESANAN MASUK (KASIR):**\n\n' .
                         '1. Buka halaman **Verifikasi** di sidebar untuk memantau pesanan pembeli.\n' .
                         '2. **Pesanan Baru**: Akan muncul status "Menunggu Verifikasi" (pembeli telah mengunggah bukti bayar QRIS).\n' .
                         '3. Klik tombol **[Terima Pesanan]**: Status otomatis berubah menjadi "Sedang Dibuat" dan masuk ke antrean aktif.\n' .
                         '4. **Pesanan Siap**: Setelah dapur selesai menyiapkan menu, klik tombol **[Pesanan Sudah Siap]** agar status di HP pembeli berubah menjadi "Siap Diambil".\n' .
                         '5. **Cetak Struk**: Anda bisa klik tombol printer 🖨️ untuk mencetak nota belanja ke printer thermal.';
            } elseif (preg_match('/(absen|hadir|masuk|pulang|izin|selfie)/', $message)) {
                $reply = '⏰ **PANDUAN PRESENSI HARIAN KASIR (ABSENSI):**\n\n' .
                         '1. Buka menu **Absensi** di sidebar.\n' .
                         '2. **Absen Masuk**:\n' .
                         '   • Klik tombol **[Absen Masuk]** saat shift dimulai.\n' .
                         '   • Ambil foto selfie menggunakan kamera webcam/HP sebagai bukti kehadiran.\n' .
                         '3. **Absen Pulang**:\n' .
                         '   • Di akhir shift, klik tombol **[Absen Pulang]** untuk mencatat jam keluar.\n' .
                         '4. **Ajukan Izin**:\n' .
                         '   • Klik **[Ajukan Izin]**, pilih tanggal, alasan (Sakit/Izin), dan lampirkan alasan.';
            } elseif (preg_match('/(pos|terminal|kasir|jual|keranjang|bayar)/', $message)) {
                $reply = '🖥️ **PANDUAN PENGGUNAAN KASIR POS TERMINAL:**\n\n' .
                         'Digunakan untuk transaksi offline (pembeli memesan langsung di meja kasir).\n\n' .
                         '1. Buka menu **POS Terminal** di sidebar.\n' .
                         '2. Pilih item menu makanan/minuman di panel kiri. Klik untuk menambahkan ke keranjang belanja.\n' .
                         '3. Atur jumlah produk dan masukkan catatan (misal: "kurang manis") jika ada.\n' .
                         '4. Klik **[Proses Pembayaran]**.\n' .
                         '5. Pilih metode pembayaran:\n' .
                         '   • **Tunai**: Masukkan uang diterima, sistem menghitung kembalian.\n' .
                         '   • **QRIS**: Scan QRIS dinamis yang muncul di layar.\n' .
                         '6. Klik **[Selesaikan Transaksi]** dan cetak nota.';
            } else {
                $reply = '👋 **Halo Kasir/Staff!** Saya asisten AI CuanGO. Berikut bantuan cepat untuk tugas harian Anda:\n\n' .
                         '• 📦 **order** - Panduan menerima pesanan & memproses antrean\n' .
                         '• 🖥️ **pos** - Cara melayani pembeli langsung di kasir\n' .
                         '• ⏰ **absen** - Cara melakukan absensi masuk & pulang dengan foto selfie\n\n' .
                         'Ketik kata kunci di atas untuk panduan detail!';
            }
        } else {
            // Pembeli
            if (preg_match('/(pesan|order|beli|checkout|keranjang|menu)/', $message)) {
                $reply = '🛒 **PANDUAN CARA MEMESAN SECARA ONLINE (PEMBELI):**\n\n' .
                         '1. Buka halaman **Eksplorasi Toko** di browser Anda.\n' .
                         '2. Pilih toko terdekat berdasarkan rekomendasi GPS atau cari berdasarkan provinsi/kota Anda.\n' .
                         '3. Klik toko untuk masuk ke daftar menu digitalnya.\n' .
                         '4. **Pilih Menu**: Masukkan item makanan/minuman ke dalam keranjang, atur jumlah, dan tambahkan catatan.\n' .
                         '5. Klik **[Checkout Sekarang]**, masukkan nama Anda, lalu klik **[Buat Pesanan]**.\n' .
                         '6. Scan kode QRIS yang muncul dan lakukan pembayaran lewat e-wallet (GoPay, OVO, Dana, dll).\n' .
                         '7. Upload screenshot bukti bayar Anda, lalu pantau antrean!';
            } elseif (preg_match('/(antre|antrian|status|siap|ambil|lacak)/', $message)) {
                $reply = '📋 **PANDUAN MELACAK STATUS ANTRIAN PESANAN:**\n\n' .
                         'Setelah mengirim bukti pembayaran, Anda dapat memantau proses pesanan secara real-time pada tab **Antrean**:\n\n' .
                         '• **Menunggu Verifikasi**: Kasir sedang memvalidasi pembayaran QRIS Anda.\n' .
                         '• **Sedang Disiapkan / Diproses**: Koki/barista sedang membuat pesanan Anda.\n' .
                         '• **Siap Diambil** (Paling Atas): Pesanan Anda sudah jadi! Silakan datang ke konter outlet untuk mengambil pesanan dengan menunjukkan nama/nomor antrean Anda.\n' .
                         '• **Riwayat**: Daftar pesanan yang telah selesai Anda beli sebelumnya.';
            } elseif (preg_match('/(gps|lokasi|terdekat|jarak|maps|alamat|cari)/', $message)) {
                $reply = '📍 **PANDUAN MENEMUKAN TOKO TERDEKAT (GPS & MAPS):**\n\n' .
                         '1. Di halaman utama, sistem akan otomatis meminta izin lokasi GPS browser Anda.\n' .
                         '2. Jika disetujui, sistem menampilkan daftar toko UMKM mitra di sekitar Anda diurutkan dari jarak terdekat.\n' .
                         '3. **Jika GPS Mati/Error (HTTP)**:\n' .
                         '   • Tenang! Anda bisa mencari toko secara manual menggunakan fitur **Cari Berdasarkan Wilayah**.\n' .
                         '   • Pilih Provinsi, Kota, Kecamatan, dan Kelurahan Anda untuk mensortir toko di area tersebut.';
            } elseif (preg_match('/(bayar|qris|transfer|bukti|upload)/', $message)) {
                $reply = '💳 **PANDUAN PEMBAYARAN VIA QRIS:**\n\n' .
                         '1. Setelah selesai memilih menu, klik checkout untuk melihat kode QRIS pembayaran.\n' .
                         '2. Pindai (scan) kode QR menggunakan aplikasi e-wallet Anda (GoPay, ShopeePay, Dana, LinkAja, BCA Mobile, dll).\n' .
                         '3. Simpan bukti transfer berupa gambar/screenshot.\n' .
                         '4. Upload gambar bukti bayar tersebut pada form yang disediakan di halaman pesanan.\n' .
                         '5. Kasir akan segera memverifikasi bukti tersebut agar pesanan Anda masuk antrean dapur.';
            } else {
                $reply = '👋 **Selamat datang di CuanGO!** Saya asisten AI yang siap memandu Anda sebagai pembeli:\n\n' .
                         '• 🛒 **pesan** - Cara memilih menu & membuat pesanan online\n' .
                         '• 💳 **bayar** - Panduan transfer QRIS & unggah bukti transfer\n' .
                         '• 📋 **antrean** - Cara melacak apakah pesanan sudah siap diambil\n' .
                         '• 📍 **gps** - Cara mendeteksi toko terdekat dari lokasi Anda\n\n' .
                         'Silakan ketik pertanyaan Anda!';
            }
        }

        return response()->json([
            'success' => true,
            'reply' => $reply
        ]);
    }

    // ============================================================
    // SIMPAN BELANJA REAL DAN TAMBAH STOK OTOMATIS
    // ============================================================
    public function storeRealBelanja(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id_barang' => 'required|integer',
            'items.*.jumlah_real' => 'required|numeric|min:0',
            'items.*.harga_satuan' => 'required|integer|min:0',
            'items.*.is_checked' => 'required|boolean',
            'catatan' => 'nullable|string',
            'tanggal' => 'required|date'
        ]);

        $items = $request->input('items');
        $checkedItems = array_filter($items, function($it) {
            return $it['is_checked'] == true && $it['jumlah_real'] > 0;
        });

        if (empty($checkedItems)) {
            return response()->json(['success' => false, 'message' => 'Tidak ada barang belanjaan yang dicentang.'], 400);
        }

        // Calculate total cost and build summary
        $totalBiaya = 0;
        $summaryText = [];
        foreach ($checkedItems as $it) {
            $subtotal = $it['jumlah_real'] * $it['harga_satuan'];
            $totalBiaya += $subtotal;
            
            $barang = DB::table('barang')->where('id', $it['id_barang'])->first();
            if ($barang) {
                $summaryText[] = $barang->nama_barang . ' (' . $it['jumlah_real'] . ' ' . ($barang->satuan_beli ?? 'pcs') . ')';
            }
        }

        $catatan = 'Belanja Bahan Baku: ' . implode(', ', $summaryText) . '. ' . ($request->input('catatan') ?? '');

        DB::beginTransaction();
        try {
            // 1. Insert into belanja table
            $belanjaId = DB::table('belanja')->insertGetId([
                'id_toko' => $user->id_toko,
                'tanggal' => $request->input('tanggal', date('Y-m-d')),
                'catatan' => $catatan,
                'total_biaya' => $totalBiaya,
                'status' => 'lunas',
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // 2. Insert into belanja_items and update stock
            foreach ($checkedItems as $it) {
                $barang = DB::table('barang')->where('id', $it['id_barang'])->where('id_toko', $user->id_toko)->first();
                if ($barang) {
                    $subtotal = $it['jumlah_real'] * $it['harga_satuan'];
                    
                    DB::table('belanja_items')->insert([
                        'id_belanja' => $belanjaId,
                        'id_barang' => $it['id_barang'],
                        'jumlah' => $it['jumlah_real'],
                        'satuan' => $barang->satuan_beli ?? $barang->satuan,
                        'harga_satuan' => $it['harga_satuan'],
                        'subtotal' => $subtotal,
                        'is_checked' => 1
                    ]);

                    // Convert unit from purchase unit to conversion factor
                    $conversionFactor = (float)($barang->faktor_konversi ?? 1.0);
                    $addedStock = $it['jumlah_real'] * $conversionFactor;

                    // Update stock and update latest cost price
                    DB::table('barang')
                        ->where('id', $it['id_barang'])
                        ->update([
                            'stok_gudang' => $barang->stok_gudang + $addedStock,
                            'harga_beli' => $it['harga_satuan'],
                            'updated_at' => now()
                        ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Belanja berhasil dicatat dan stok gudang terupdate!']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal mencatat belanja: ' . $e->getMessage()], 500);
        }
    }

    public function updateNotifications(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'notif_pesanan_masuk' => 'required|boolean',
            'notif_pembayaran_diterima' => 'required|boolean',
            'notif_stok_menipis' => 'required|boolean',
            'notif_absensi_karyawan' => 'required|boolean',
        ]);

        $tokoId = $user->id_toko;
        $keys = [
            'notif_pesanan_masuk' => 'toko_' . $tokoId . '_notif_pesanan_masuk',
            'notif_pembayaran_diterima' => 'toko_' . $tokoId . '_notif_pembayaran_diterima',
            'notif_stok_menipis' => 'toko_' . $tokoId . '_notif_stok_menipis',
            'notif_absensi_karyawan' => 'toko_' . $tokoId . '_notif_absensi_karyawan',
        ];

        try {
            foreach ($keys as $inputKey => $dbKey) {
                DB::table('meta')->updateOrInsert(
                    ['key' => $dbKey],
                    ['value' => $request->input($inputKey) ? '1' : '0']
                );
            }
            return response()->json(['success' => true, 'message' => 'Pengaturan notifikasi berhasil diperbarui!']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui notifikasi: ' . $e->getMessage()], 500);
        }
    }

    public function berlanggananPage(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return redirect()->route('login');
        }

        $tokoId = $user->id_toko;
        $tierMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_tier')->first();
        $expiryMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_expiry')->first();
        $cancelMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_cancel')->first();

        $tier = $tierMeta ? $tierMeta->value : 'free';
        $expiry = $expiryMeta ? $expiryMeta->value : null;
        $isCanceled = $cancelMeta ? $cancelMeta->value === '1' : false;

        $devPayment = $this->getDevPaymentConfig();

        return Inertia::render('Berlangganan', [
            'current_tier' => $tier,
            'expiry_date' => $expiry,
            'subscription_cancel' => $isCanceled,
            'dev_payment' => [
                'bank_name' => $devPayment['bank_name'],
                'no_rekening' => $devPayment['no_rekening'],
                'nama_pemilik' => $devPayment['nama_pemilik'],
                'prices' => $devPayment['prices'],
            ],
            'user' => [
                'name' => $user->nama,
                'role' => $user->role,
            ]
        ]);
    }

    public function updateSubscription(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'tier' => 'required|string|in:free,monthly,3months,yearly'
        ]);

        $tier = $request->input('tier');
        $tokoId = $user->id_toko;

        $days = 0;
        if ($tier === 'monthly') $days = 30;
        elseif ($tier === '3months') $days = 90;
        elseif ($tier === 'yearly') $days = 365;

        $expiry = null;
        if ($days > 0) {
            $expiryMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_expiry')->first();
            $currentExpiry = $expiryMeta ? $expiryMeta->value : null;

            if ($currentExpiry && strtotime($currentExpiry) > time()) {
                // Subscription is still active, append days to it
                $expiry = date('Y-m-d', strtotime($currentExpiry . " + {$days} days"));
            } else {
                $expiry = now()->addDays($days)->toDateString();
            }
        }

        try {
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_tier'],
                ['value' => $tier]
            );
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_expiry'],
                ['value' => $expiry]
            );
            // Reset cancel flag
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_cancel'],
                ['value' => '0']
            );

            $tierLabels = [
                'free' => 'Gratis (Fee per Transaksi)',
                'monthly' => 'Bulanan (Langganan)',
                '3months' => '3 Bulan (Langganan Hemat)',
                'yearly' => 'Tahunan (Langganan Hemat)'
            ];

            return response()->json([
                'success' => true,
                'message' => 'Paket berlangganan Anda berhasil diperbarui ke ' . $tierLabels[$tier] . '!'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memperbarui paket langganan: ' . $e->getMessage()], 500);
        }
    }

    // ============================================================
    // PAYMENT GATEWAY INTEGRATION GUIDE (MIDTRANS / XENDIT / TRIPAY)
    // ============================================================
    /**
     * PANDUAN INTEGRASI PAYMENT GATEWAY UNTUK PENDETEKSIAN OTOMATIS:
     * 
     * Untuk mengotomatisasi sistem pembayaran (QRIS Dinamis / Virtual Account) agar 
     * aplikasi tahu uang sudah masuk secara real-time, kita dapat menggunakan Payment Gateway
     * resmi Indonesia seperti Midtrans, Xendit, atau Tripay.
     * 
     * Alur Kerja Webhook:
     * 1. Admin/User melakukan checkout -> POSController membuat tagihan ke API Midtrans/Xendit.
     * 2. Midtrans/Xendit mengembalikan URL pembayaran, nomor VA, atau string QRIS dinamis.
     * 3. Pembeli melakukan scan QRIS atau transfer ke nomor VA.
     * 4. Server Payment Gateway mengirimkan POST request (Webhook/Callback) ke URL website kita.
     * 5. Endpoint Webhook memverifikasi Signature Key, lalu mengubah status transaksi di database.
     */

    /**
     * CONTOH INTEGRASI WEBHOOK CALLBACK (XENDIT)
     * URL Webhook Terdaftar: https://domain-anda.com/api/payment/callback
     */
    public function handleXenditCallback(Request $request)
    {
        // 1. Verifikasi callback token dari header Xendit untuk keamanan
        $callbackToken = $request->header('x-callback-token');
        $expectedToken = env('XENDIT_CALLBACK_TOKEN'); // Set token di file .env

        if ($callbackToken !== $expectedToken) {
            return response()->json(['message' => 'Unauthorized Callback Token'], 401);
        }

        $payload = $request->all();
        $externalId = $payload['external_id']; // ID Tagihan kita (misal: "SUB-TOKO-1-12345")
        $status = $payload['status']; // "PAID", "EXPIRED", dll
        $amount = $payload['amount'];

        if ($status === 'PAID') {
            // Ekstrak ID Toko dari External ID
            // Format: SUB-TOKO-{tokoId}-{timestamp}
            if (preg_match('/SUB-TOKO-(\d+)-/', $externalId, $matches)) {
                $tokoId = $matches[1];
                
                // Tentukan paket berdasarkan harga/nominal pembayaran
                $tier = 'monthly';
                $expiry = now()->addDays(30)->toDateString();
                if ($amount >= 830000) {
                    $tier = 'yearly';
                    $expiry = now()->addDays(365)->toDateString();
                } elseif ($amount >= 250000) {
                    $tier = '3months';
                    $expiry = now()->addDays(90)->toDateString();
                }

                // Update status langganan toko secara otomatis
                DB::table('meta')->updateOrInsert(
                    ['key' => 'toko_' . $tokoId . '_subscription_tier'],
                    ['value' => $tier]
                );
                DB::table('meta')->updateOrInsert(
                    ['key' => 'toko_' . $tokoId . '_subscription_expiry'],
                    ['value' => $expiry]
                );

                Log::info("Langganan Toko ID: {$tokoId} berhasil diaktifkan otomatis via Xendit VA/QRIS. Nominal: {$amount}");
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * CONTOH INTEGRASI WEBHOOK CALLBACK (MIDTRANS)
     * URL Webhook Terdaftar: https://domain-anda.com/api/payment/midtrans-notification
     */
    public function handleMidtransNotification(Request $request)
    {
        $payload = $request->all();
        
        // 1. Validasi Signature Key dari Midtrans demi keamanan
        $orderId = $payload['order_id'];
        $statusCode = $payload['status_code'];
        $grossAmount = $payload['gross_amount'];
        $serverKey = env('MIDTRANS_SERVER_KEY');
        
        $signature = hash("sha512", $orderId . $statusCode . $grossAmount . $serverKey);
        
        if ($signature !== $payload['signature_key']) {
            return response()->json(['message' => 'Invalid Signature'], 400);
        }

        $transactionStatus = $payload['transaction_status'];
        $paymentType = $payload['payment_type']; // "qris", "bank_transfer", dll

        if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
            // Pembayaran Berhasil!
            if (preg_match('/SUB-TOKO-(\d+)-/', $orderId, $matches)) {
                $tokoId = $matches[1];
                $amount = (float)$grossAmount;

                $tier = 'monthly';
                $expiry = now()->addDays(30)->toDateString();
                if ($amount >= 830000) {
                    $tier = 'yearly';
                    $expiry = now()->addDays(365)->toDateString();
                } elseif ($amount >= 250000) {
                    $tier = '3months';
                    $expiry = now()->addDays(90)->toDateString();
                }

                DB::table('meta')->updateOrInsert(
                    ['key' => 'toko_' . $tokoId . '_subscription_tier'],
                    ['value' => $tier]
                );
                DB::table('meta')->updateOrInsert(
                    ['key' => 'toko_' . $tokoId . '_subscription_expiry'],
                    ['value' => $expiry]
                );

                Log::info("Langganan Toko ID: {$tokoId} berhasil diaktifkan otomatis via Midtrans. Tipe: {$paymentType}");
            }
        }

        return response()->json(['status' => 'OK']);
    }

    /**
     * Endpoint untuk me-render QRIS Dinamis Mandiri
     * Uang ditransfer langsung ke QRIS BCA / ShopeePay milik developer.
     */
    public function generateCheckoutQris(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'tier' => 'required|string|in:monthly,3months,yearly'
        ]);

        $tier = $request->input('tier');

        $devPayment = $this->getDevPaymentConfig();
        $prices = $devPayment['prices'];
        $amount = $prices[$tier] ?? 0;
        $tokoId = $user->id_toko;

        // Cek jika sudah ada kode unik tersimpan untuk sesi paket ini
        $pendingCodeMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_pending_code')->first();
        $pendingTierMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_pending_tier')->first();

        if ($pendingCodeMeta && $pendingTierMeta && $pendingTierMeta->value === $tier) {
            $uniqueCode = (int)$pendingCodeMeta->value;
        } else {
            $uniqueCode = rand(100, 999);
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_pending_code'],
                ['value' => (string)$uniqueCode]
            );
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_pending_tier'],
                ['value' => $tier]
            );
        }

        $uniqueAmount = $amount + $uniqueCode;

        // Static QRIS Developer (rekening developer, bisa diubah lewat settings)
        $staticQris = $devPayment['qris_string'];

        // Gunakan service QRISGenerator untuk menyisipkan nominal unik (direct to rekening developer)
        $dynamicQris = \App\Services\QRISGenerator::makeDynamic($staticQris, $uniqueAmount);

        return response()->json([
            'success' => true,
            'qris_string' => $dynamicQris,
            'amount' => $amount,
            'unique_code' => $uniqueCode,
            'unique_amount' => $uniqueAmount,
            'bank_name' => $devPayment['bank_name'],
            'no_rekening' => $devPayment['no_rekening'],
            'nama_pemilik' => $devPayment['nama_pemilik']
        ]);
    }

    /**
     * Endpoint verifikasi pembayaran KlikBCA secara otomatis via scraping mutasi bank.
     */
    public function verifyManualSubscription(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'tier' => 'required|string|in:monthly,3months,yearly',
            'payment_method' => 'required|string|in:qris,va'
        ]);

        $tier = $request->input('tier');
        $tokoId = $user->id_toko;

        // Ambil kode unik tersimpan dari database
        $pendingCodeMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_pending_code')->first();
        if (!$pendingCodeMeta) {
            return response()->json(['success' => false, 'message' => 'Tidak ditemukan rincian pembayaran pending untuk toko ini.'], 400);
        }
        $uniqueCode = (int)$pendingCodeMeta->value;

        $devPayment = $this->getDevPaymentConfig();
        $prices = $devPayment['prices'];
        $amount = $prices[$tier] ?? 0;
        $uniqueAmount = $amount + $uniqueCode;

        // Ambil akun BCA developer dari file .env (jika tidak disetel, mode simulasi berjalan aman)
        $bcaUser = env('DEVELOPER_BCA_USER', 'MOCK_USER');
        $bcaPin = env('DEVELOPER_BCA_PIN', '123456');

        // Periksa mutasi KlikBCA dengan target nominal unik persis
        $check = \App\Services\BCAScraper::checkMutation($bcaUser, $bcaPin, $uniqueAmount);

        if ($check['success']) {
            // Hapus kode unik pending setelah sukses verifikasi
            DB::table('meta')->where('key', 'toko_' . $tokoId . '_pending_code')->delete();
            DB::table('meta')->where('key', 'toko_' . $tokoId . '_pending_tier')->delete();
            
            $days = 0;
            if ($tier === 'monthly') $days = 30;
            elseif ($tier === '3months') $days = 90;
            elseif ($tier === 'yearly') $days = 365;

            $expiry = null;
            if ($days > 0) {
                $expiryMeta = DB::table('meta')->where('key', 'toko_' . $tokoId . '_subscription_expiry')->first();
                $currentExpiry = $expiryMeta ? $expiryMeta->value : null;

                if ($currentExpiry && strtotime($currentExpiry) > time()) {
                    // Subscription is still active, append days to it
                    $expiry = date('Y-m-d', strtotime($currentExpiry . " + {$days} days"));
                } else {
                    $expiry = now()->addDays($days)->toDateString();
                }
            }

            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_tier'],
                ['value' => $tier]
            );
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_expiry'],
                ['value' => $expiry]
            );
            // Reset cancel flag
            DB::table('meta')->updateOrInsert(
                ['key' => 'toko_' . $tokoId . '_subscription_cancel'],
                ['value' => '0']
            );

            return response()->json([
                'success' => true,
                'message' => $check['message']
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $check['message']
        ]);
    }

    // ============================================================
    // PORTAL DEVELOPER (HIDDEN PORTAL) & CORE SETTINGS
    // ============================================================
    public function devLoginPage(Request $request)
    {
        if (session('dev_logged_in') === true) {
            return redirect()->route('dev.dashboard');
        }
        return Inertia::render('DevLogin');
    }

    public function devLoginPost(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        $devUser = env('DEVELOPER_USER', 'developer');
        $devPassMeta = DB::table('meta')->where('key', 'dev_portal_password')->first();
        $devPass = $devPassMeta ? $devPassMeta->value : env('DEVELOPER_PASSWORD', 'devhaltea123');

        if ($request->username === $devUser && $request->password === $devPass) {
            session(['dev_logged_in' => true]);
            return response()->json(['success' => true, 'message' => 'Login Developer berhasil!']);
        }

        return response()->json(['success' => false, 'message' => 'Kredensial portal developer salah.'], 401);
    }

    public function devDashboardPage(Request $request)
    {
        $this->cleanupOldTransferProofs();
        if (session('dev_logged_in') !== true) {
            return redirect()->route('dev.login');
        }

        $devPayment = $this->getDevPaymentConfig();
        $freePlanFee = $this->getFreePlanTransactionFee();

        $domainMeta = DB::table('meta')->where('key', 'dev_domain_price_yearly')->first();
        $domainPriceYearly = $domainMeta ? (int)$domainMeta->value : 150000;

        $hostingMeta = DB::table('meta')->where('key', 'dev_hosting_price_yearly')->first();
        $hostingPriceYearly = $hostingMeta ? (int)$hostingMeta->value : 1200000;

        $midtransMeta = DB::table('meta')->where('key', 'dev_midtrans_bank_transfer_fee')->first();
        $midtransTransferFee = $midtransMeta ? (int)$midtransMeta->value : 4000;

        $tokos = DB::table('toko')->get()->map(function ($t) {
            $admin = DB::table('users')
                ->where('id_toko', $t->id)
                ->where('role', 'admin')
                ->first();

            $waMeta = DB::table('meta')->where('key', 'toko_' . $t->id . '_no_wa')->first();
            $wa = $waMeta ? $waMeta->value : ($admin ? $admin->username : '-');

            $bankConfig = DB::table('qris_config')->where('id_toko', $t->id)->first();

            $tier = $this->getActiveSubscriptionTier($t->id);

            $totalTransactions = DB::table('transaksi')
                ->where('id_toko', $t->id)
                ->where('status_pembayaran', 'lunas')
                ->whereDate('created_at', now()->toDateString())
                ->count();

            $totalRevenue = DB::table('transaksi')
                ->where('id_toko', $t->id)
                ->where('status_pembayaran', 'lunas')
                ->whereDate('created_at', now()->toDateString())
                ->sum('total_biaya') ?: 0;

            return [
                'id' => $t->id,
                'nama_toko' => $t->nama_toko,
                'nama_admin' => $admin ? $admin->nama : 'N/A',
                'wa_toko' => $wa,
                'bank_name' => $bankConfig ? $bankConfig->bank_name : '-',
                'no_rekening' => $bankConfig ? $bankConfig->no_rekening : '-',
                'nama_pemilik' => $bankConfig ? $bankConfig->nama_pemilik : '-',
                'tier' => $tier,
                'total_transactions' => $totalTransactions,
                'total_revenue' => (int)$totalRevenue
            ];
        });

        $buktiTransfers = DB::table('bukti_transfer')
            ->join('toko', 'bukti_transfer.id_toko', '=', 'toko.id')
            ->select('bukti_transfer.*', 'toko.nama_toko')
            ->orderBy('bukti_transfer.tanggal', 'desc')
            ->get();

        return Inertia::render('DevDashboard', [
            'dev_payment' => [
                'qris_string' => $devPayment['qris_string'],
                'bank_name' => $devPayment['bank_name'],
                'no_rekening' => $devPayment['no_rekening'],
                'nama_pemilik' => $devPayment['nama_pemilik'],
                'prices' => $devPayment['prices'],
                'free_plan_fee' => $freePlanFee,
                'domain_price_yearly' => $domainPriceYearly,
                'hosting_price_yearly' => $hostingPriceYearly,
                'midtrans_bank_transfer_fee' => $midtransTransferFee
            ],
            'tokos' => $tokos,
            'bukti_transfers' => $buktiTransfers
        ]);
    }

    public function devLogout(Request $request)
    {
        session()->forget('dev_logged_in');
        return redirect()->route('dev.login');
    }

    public function updateDevPayment(Request $request)
    {
        if (session('dev_logged_in') !== true) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'qris_string' => 'nullable|string',
            'bank_name' => 'required|string|max:100',
            'no_rekening' => 'required|string|max:50',
            'nama_pemilik' => 'required|string|max:100',
            'price_monthly' => 'required|numeric|min:0',
            'price_3months' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'free_plan_fee' => 'required|numeric|min:0',
            'domain_price_yearly' => 'required|numeric|min:0',
            'hosting_price_yearly' => 'required|numeric|min:0',
            'midtrans_bank_transfer_fee' => 'required|numeric|min:0'
        ]);

        $map = [
            'dev_payment_qris_string' => $request->input('qris_string'),
            'dev_payment_bank_name' => $request->input('bank_name'),
            'dev_payment_no_rekening' => $request->input('no_rekening'),
            'dev_payment_nama_pemilik' => $request->input('nama_pemilik'),
            'dev_sub_price_monthly' => (int)$request->input('price_monthly'),
            'dev_sub_price_3months' => (int)$request->input('price_3months'),
            'dev_sub_price_yearly' => (int)$request->input('price_yearly'),
            'dev_free_plan_transaction_fee' => (int)$request->input('free_plan_fee'),
            'dev_domain_price_yearly' => (int)$request->input('domain_price_yearly'),
            'dev_hosting_price_yearly' => (int)$request->input('hosting_price_yearly'),
            'dev_midtrans_bank_transfer_fee' => (int)$request->input('midtrans_bank_transfer_fee')
        ];

        try {
            foreach ($map as $key => $value) {
                DB::table('meta')->updateOrInsert(['key' => $key], ['value' => (string)$value]);
            }
            return response()->json([
                'success' => true,
                'message' => 'Konfigurasi portal developer berhasil diperbarui!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function verifyTransferProof(Request $request, $id)
    {
        if (session('dev_logged_in') !== true) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|string|in:approved,rejected'
        ]);

        DB::table('bukti_transfer')
            ->where('id', $id)
            ->update([
                'status' => $request->status,
                'updated_at' => now()
            ]);

        return response()->json(['success' => true, 'message' => 'Status transfer berhasil diperbarui!']);
    }

    public function changeDevPassword(Request $request)
    {
        if (session('dev_logged_in') !== true) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'old_password' => 'required|string',
            'new_password' => 'required|string|min:6'
        ]);

        $devPassMeta = DB::table('meta')->where('key', 'dev_portal_password')->first();
        $currentPass = $devPassMeta ? $devPassMeta->value : env('DEVELOPER_PASSWORD', 'devhaltea123');

        if ($request->old_password !== $currentPass) {
            return response()->json(['success' => false, 'message' => 'Password lama developer salah.'], 400);
        }

        DB::table('meta')->updateOrInsert(
            ['key' => 'dev_portal_password'],
            ['value' => $request->new_password]
        );

        return response()->json(['success' => true, 'message' => 'Password developer berhasil diubah!']);
    }

    public function devUploadPayout(Request $request)
    {
        if (session('dev_logged_in') !== true) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'id_toko' => 'required|integer',
            'nominal' => 'required|numeric|min:1',
            'tanggal' => 'required|date',
            'gambar_file' => 'required|image|max:4096'
        ]);

        $tokoId = $request->id_toko;

        $filePath = null;
        if ($request->hasFile('gambar_file')) {
            $file = $request->file('gambar_file');
            $filename = 'payout_dev_' . $tokoId . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/bukti_transfer'), $filename);
            $filePath = 'uploads/bukti_transfer/' . $filename;
        }

        DB::table('bukti_transfer')->insert([
            'id_toko' => $tokoId,
            'tanggal' => $request->tanggal,
            'nominal' => $request->nominal,
            'gambar' => $filePath,
            'status' => 'approved',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['success' => true, 'message' => 'Bukti pencairan ke toko berhasil diunggah!']);
    }

    // ============================================================
    // ADVANCED SUBSCRIPTION & ORDER CONTROL APIs
    // ============================================================
    public function cancelSubscription(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $tokoId = $user->id_toko;
        DB::table('meta')->updateOrInsert(
            ['key' => 'toko_' . $tokoId . '_subscription_cancel'],
            ['value' => '1']
        );

        return response()->json([
            'success' => true,
            'message' => 'Perpanjangan otomatis berhasil dibatalkan. Layanan aktif Anda tidak hangus dan akan tetap berjalan hingga masa durasi berakhir.'
        ]);
    }

    public function deleteOrderAdmin(Request $request, $id)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            DB::table('transaksi')->where('order_id', $id)->where('id_toko', $user->id_toko)->delete();
            DB::table('transaksi_items')->where('order_id', $id)->delete();
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Pesanan berhasil dihapus secara permanen dari database.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal menghapus pesanan: ' . $e->getMessage()], 500);
        }
    }

    public function toggleTokoStatus(Request $request)
    {
        $user = $this->getAuthUser();
        if (!$user || $user->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $toko = DB::table('toko')->where('id', $user->id_toko)->first();
        if (!$toko) {
            return response()->json(['success' => false, 'message' => 'Toko tidak ditemukan.'], 404);
        }

        $newStatus = $toko->is_active === 1 ? 0 : 1;
        DB::table('toko')->where('id', $user->id_toko)->update(['is_active' => $newStatus, 'updated_at' => now()]);

        $msg = $newStatus === 1 ? 'Toko berhasil DIBUKA! Pelanggan kini dapat memesan.' : 'Toko berhasil DITUTUP! Pelanggan tidak dapat mengirim pesanan baru.';

        return response()->json([
            'success' => true,
            'is_active' => $newStatus,
            'message' => $msg
        ]);
    }

    // ============================================================
    // MIDTRANS CHARGE & SIMULATION APIs
    // ============================================================
    public function createMidtransCharge(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
            'amount' => 'required|numeric'
        ]);

        $orderId = $request->input('order_id');
        $amount = (float)$request->input('amount');

        // Check if Midtrans Server Key is configured
        $serverKey = env('MIDTRANS_SERVER_KEY');
        if (empty($serverKey)) {
            // Simulation Mode: return a mock Snap token and success redirect URL
            return response()->json([
                'success' => true,
                'simulation' => true,
                'token' => 'mock-midtrans-snap-token-' . rand(1000, 9999),
                'redirect_url' => route('pembeli.success', ['order_id' => $orderId])
            ]);
        }

        // Real Midtrans Snap transaction creation
        $isProd = env('MIDTRANS_IS_PRODUCTION', false);
        $baseUrl = $isProd 
            ? 'https://app.midtrans.com/snap/v1/transactions' 
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->withBasicAuth($serverKey, '')
            ->post($baseUrl, [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => (int)round($amount),
                ]
            ]);

            if ($response->successful()) {
                $resData = $response->json();
                return response()->json([
                    'success' => true,
                    'simulation' => false,
                    'token' => $resData['token'],
                    'redirect_url' => $resData['redirect_url']
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi gerbang pembayaran Midtrans: ' . $response->body()
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kesalahan koneksi Midtrans: ' . $e->getMessage()
            ], 500);
        }
    }

    public function simulateMidtransPayment(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string'
        ]);

        $orderId = $request->input('order_id');

        DB::beginTransaction();
        try {
            DB::table('transaksi')->where('order_id', $orderId)->update([
                'status_pembayaran' => 'lunas',
                'status_pesanan' => 'diproses',
                'updated_at' => now()
            ]);

            // Deduct stock for all items
            $orderItems = DB::table('transaksi_items')->where('order_id', $orderId)->get();
            foreach ($orderItems as $item) {
                $this->deductStock($item->id_menu, $item->jumlah);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Simulasi pembayaran Midtrans berhasil diselesaikan! Status order lunas.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal simulasi: ' . $e->getMessage()
            ], 500);
        }
    }
}
