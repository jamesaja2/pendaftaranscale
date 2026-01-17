1
Create Payment
GET
Membuat tagihan baru. Mendukung mode Hosted Page dan Custom UI.

Parameter
apikey	Wajib
amount	Min. 1000
Contoh Request (PHP cURL)

$url = "https://yogateway.id//api.php?action=createpayment&apikey=yo_sec_838305adae4409497269b24bd8097453&amount=10000";
$res = file_get_contents($url);
$data = json_decode($res, true);
                            
Respon JSON
{
  "status": true,
  "data": {
    "trx_id": "YO-EXAMPLE",
    "amount": 10123,
    "payment_url": "https://yogateway.id/index.php?page=pay&slug=xxxxx",
    "qr_image": "https://yogateway.id/assets/qris/qris_example.png",
    "expired_at": "2025-12-31 23:59:59",
    "environment": "production"
  }
}
                    
2
Check Status
GET
Mengecek status pembayaran (Pending/Success/Expired).

https://yogateway.id//api.php?action=checkstatus&apikey=yo_sec_838305adae4409497269b24bd8097453&trxid=YO-EXAMPLE:
Jika Sukses / Pending
{
  "status": true,
  "data": {
    "status": "SUCCESS",
    "trx_id": "YO-...",
    "amount": 10000,
    "payment_url": "...",
    "qr_image": "..."
  }
}
Jika Expired
{
  "status": true,
  "data": {
    "status": "EXPIRED",
    "qris_image": "https://.../expired.png"
  }
}

3
Webhook (Callback)
POST
Kami akan mengirimkan notifikasi POST ke Webhook URL Anda saat pembayaran sukses.

Contoh Payload Sukses (JSON Body):
{
  "trxid": "YO-C49478CE",
  "amount": 10123,
  "status": "SUCCESS",
  "paid_at": "2025-12-28 19:57:54"
}

Payload Expired (POST)
{
  "trxid": "YO-ABC...",
  "amount": 10123,
  "status": "EXPIRED", 
  "paid_at": null
}
        
Header Penting:
Content-Type: application/json X-YoGateway-Signature: 8b065f4d2f0a3e813f8c8d... (HMAC-SHA256)
Keamanan (Wajib): Pastikan Anda memverifikasi X-YoGateway-Signature menggunakan Webhook Secret proyek Anda. Ini mencegah penipuan dari pihak ketiga.