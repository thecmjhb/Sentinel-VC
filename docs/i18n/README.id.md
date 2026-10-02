<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Bahasa Indonesia

[English](../../README.md) · [中文](../../docs/i18n/README.zh-CN.md) · [हिन्दी](../../docs/i18n/README.hi.md) · [Español](../../docs/i18n/README.es.md) · [العربية](../../docs/i18n/README.ar.md)

[Français](../../docs/i18n/README.fr.md) · [বাংলা](../../README.bn.md) · [Português](../../docs/i18n/README.pt.md) · [Bahasa Indonesia](../../docs/i18n/README.id.md) · [اردو](../../docs/i18n/README.ur.md)

Sentinel-VC adalah kerangka moderasi sumber terbuka untuk supergrup Telegram. Sistem memantau peristiwa masuk/keluar yang tersedia dan aktivitas pesan cepat. Adaptor opsional dengan akun pengguna admin menambahkan peristiwa peserta panggilan yang diterima serta tindakan mute sesuai izin. Penulis: **C. M. Jubayer Hossain Bappy**.

## Menggunakan bot proyek

Setelah pemilik menjalankan layanan, tambahkan [@sentinelvcbot](https://t.me/sentinelvcbot) ke supergrup Anda. Jadikan bot admin dengan izin **Restrict Members**. Melalui akun admin pribadi, kirim `/setup`, tunggu beberapa detik, lalu gunakan `/doctor` dan `/status`. Mulai dengan mode observe; gunakan `/mode enforce` setelah meninjau aktivitas. `/gate on` mengaktifkan pembatasan chat sementara dan soal aritmetika untuk anggota baru.

## Menjalankan di VPS sendiri

Pasang [Docker dan Compose pada Ubuntu](https://docs.docker.com/engine/install/ubuntu/). Setelah repositori diterbitkan:

```bash
git clone https://github.com/thecmjhb/Sentinel-VC.git
cd Sentinel-VC
bash scripts/setup.sh
```

Pilih port pemeriksaan kesehatan VPS saat penyiapan; nilai awalnya **18765**. Tekan Enter untuk mempertahankan port yang ditampilkan. Untuk mengubahnya nanti: `bash scripts/setup.sh --port 19234`. Pengaturan `.env` lainnya tetap tersimpan. Untuk npm, atur `HTTP_PORT` di `.env`.

Asisten meminta token tanpa menampilkannya dan tidak mengubah `.env` yang sudah ada. Jangan kirim token melalui chat, tangkapan layar, atau GitHub. Periksa proses awal:

```bash
docker compose logs --tail=50 sentinel
curl --fail "http://$(docker compose port sentinel 8080)/readyz"
```

Tanpa Docker, gunakan Node.js 24 LTS: salin `.env.example` menjadi `.env`, isi `BOT_TOKEN`, lalu jalankan `npm ci --ignore-scripts` dan `npm start`. Lihat [panduan operasional](../SELF_HOSTING.md) untuk layanan permanen dan pencadangan.

## Perintah dan batasan

`/incidents` hanya menampilkan catatan terbaru grup saat ini kepada admin. `/mode observe` menghentikan tindakan moderasi baru. Anggota yang dibatasi dapat membuka chat pribadi bot dan mengirim `/verify` diikuti ID grup yang tercantum pada tantangan. Tiga jawaban salah menghabiskan kesempatan; pembatasan flood tidak bisa dicabut pada menit pertama.

Bot biasa tidak melihat paket UDP mentah, tanggal pembuatan akun yang sebenarnya, atau seluruh peserta panggilan secara langsung. Membatasi pesan suara bukan mute panggilan. [Adaptor VC](../VC_SETUP.md) membutuhkan akun pengguna admin yang menyetujui, sesi pribadi, dan daftar grup yang diizinkan. Admin mengembalikan pengaturan panggilan secara manual.

## Komunitas dan lisensi

Bergabung dengan [kanal pembaruan](https://t.me/sentinelvc) bersifat opsional. Untuk bantuan, gunakan [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). Kode berlisensi MIT; pertahankan [lisensi](../../LICENSE) dan atribusi.
