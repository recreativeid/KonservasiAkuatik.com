<?php

namespace App\Services;

class QRISGenerator
{
    /**
     * Mengubah QRIS Statis menjadi QRIS Dinamis dengan nominal tertentu.
     * 
     * @param string $staticQris String QRIS statis bawaan bank/merchant (e.g. ShopeePay/BCA)
     * @param float|int $amount Nominal pembayaran
     * @return string String QRIS Dinamis hasil modifikasi
     */
    public static function makeDynamic($staticQris, $amount)
    {
        $staticQris = trim($staticQris);
        
        // 1. Validasi string QRIS minimal (biasanya diawali 000201)
        if (substr($staticQris, 0, 6) !== '000201') {
            return $staticQris;
        }

        // 2. Bersihkan checksum lama di bagian akhir (misalnya, buang 4 karakter terakhir setelah "6304")
        if (preg_match('/(.*6304)[0-9A-Fa-f]{4}$/', $staticQris, $matches)) {
            $baseString = $matches[1];
        } else {
            // Jika tidak ada akhiran 6304, tambahkan saja di ujung
            if (strpos($staticQris, '6304') !== false) {
                $baseString = substr($staticQris, 0, strpos($staticQris, '6304') + 4);
            } else {
                $baseString = $staticQris . '6304';
            }
        }

        // 3. Format nilai nominal
        // Contoh: jika amount = 99000, maka format tag 54 adalah "540599000"
        $amountStr = (string)round($amount);
        $amountLength = str_pad(strlen($amountStr), 2, '0', STR_PAD_LEFT);
        $tag54 = '54' . $amountLength . $amountStr;

        // 4. Cari dan hapus tag 54 lama jika ada
        // EMVCo format: [Tag 2-char][Length 2-char][Value]
        // Cari tag 54
        $processedString = self::removeTag($baseString, '54');

        // 5. Sisipkan tag 54 yang baru sebelum tag 58 (Country Code) atau tag 59 (Merchant Name)
        $insertPos = strpos($processedString, '5802'); // Biasanya disisipkan sebelum tag 58
        if ($insertPos === false) {
            $insertPos = strpos($processedString, '59'); // Atau sebelum tag 59
        }

        if ($insertPos !== false) {
            $processedString = substr($processedString, 0, $insertPos) . $tag54 . substr($processedString, $insertPos);
        } else {
            // Jika tag 58/59 tidak ditemukan, sisipkan sebelum tag 6304 di ujung
            $processedString = substr($processedString, 0, -4) . $tag54 . '6304';
        }

        // 6. Hitung ulang checksum CRC16 CCITT
        $crc = self::crc16($processedString);

        return $processedString . $crc;
    }

    /**
     * Menghapus tag tertentu dari payload EMVCo.
     */
    private static function removeTag($string, $targetTag)
    {
        $i = 0;
        $len = strlen($string);
        $result = '';

        while ($i < $len) {
            // Tag 6304 biasanya di akhir dan tidak diproses
            if (substr($string, $i, 4) === '6304') {
                $result .= substr($string, $i);
                break;
            }

            $tag = substr($string, $i, 2);
            if (!ctype_digit($tag)) {
                $result .= substr($string, $i);
                break;
            }

            $lengthStr = substr($string, $i + 2, 2);
            $length = (int)$lengthStr;
            $totalTagLength = 4 + $length;

            if ($tag !== $targetTag) {
                $result .= substr($string, $i, $totalTagLength);
            }

            $i += $totalTagLength;
        }

        return $result;
    }

    /**
     * Menghitung Checksum CRC16 CCITT.
     */
    public static function crc16($data)
    {
        $crc = 0xFFFF;
        for ($i = 0; $i < strlen($data); $i++) {
            $x = (($crc >> 8) ^ ord($data[$i])) & 0xFF;
            $x ^= $x >> 4;
            $crc = (($crc << 8) ^ ($x << 12) ^ ($x << 5) ^ ($x)) & 0xFFFF;
        }
        $hex = dechex($crc);
        return strtoupper(str_pad($hex, 4, '0', STR_PAD_LEFT));
    }
}
