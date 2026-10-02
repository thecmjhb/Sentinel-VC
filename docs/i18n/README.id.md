<p align="center"><img src="../../assets/social-preview.png" alt="Sentinel-VC" width="520"></p>

# Sentinel-VC — Bahasa Indonesia

<!-- languages:start -->
<p align="center" dir="ltr">
<a href="../../README.md" title="English"><img src="../../assets/languages/en.svg" width="64" height="28" alt="English"></a><a href="../../README.bn.md" title="বাংলা"><img src="../../assets/languages/bn.svg" width="64" height="28" alt="বাংলা"></a><a href="README.zh-CN.md" title="中文"><img src="../../assets/languages/zh.svg" width="64" height="28" alt="中文"></a><a href="README.hi.md" title="हिन्दी"><img src="../../assets/languages/hi.svg" width="64" height="28" alt="हिन्दी"></a><a href="README.es.md" title="Español"><img src="../../assets/languages/es.svg" width="64" height="28" alt="Español"></a><a href="README.ar.md" title="العربية"><img src="../../assets/languages/ar.svg" width="64" height="28" alt="العربية"></a><a href="README.fr.md" title="Français"><img src="../../assets/languages/fr.svg" width="64" height="28" alt="Français"></a><a href="README.pt.md" title="Português"><img src="../../assets/languages/pt.svg" width="64" height="28" alt="Português"></a><a href="README.id.md" title="Bahasa Indonesia"><img src="../../assets/languages/id.svg" width="64" height="28" alt="Bahasa Indonesia"></a><a href="README.ur.md" title="اردو"><img src="../../assets/languages/ur.svg" width="64" height="28" alt="اردو"></a><br>
<a href="README.ru.md" title="Русский"><img src="../../assets/languages/ru.svg" width="64" height="28" alt="Русский"></a><a href="README.ko.md" title="한국어"><img src="../../assets/languages/ko.svg" width="64" height="28" alt="한국어"></a><a href="README.ja.md" title="日本語"><img src="../../assets/languages/ja.svg" width="64" height="28" alt="日本語"></a><a href="README.de.md" title="Deutsch"><img src="../../assets/languages/de.svg" width="64" height="28" alt="Deutsch"></a><a href="README.tr.md" title="Türkçe"><img src="../../assets/languages/tr.svg" width="64" height="28" alt="Türkçe"></a><a href="README.it.md" title="Italiano"><img src="../../assets/languages/it.svg" width="64" height="28" alt="Italiano"></a><a href="README.fa.md" title="فارسی"><img src="../../assets/languages/fa.svg" width="64" height="28" alt="فارسی"></a><a href="README.vi.md" title="Tiếng Việt"><img src="../../assets/languages/vi.svg" width="64" height="28" alt="Tiếng Việt"></a><a href="README.ta.md" title="தமிழ்"><img src="../../assets/languages/ta.svg" width="64" height="28" alt="தமிழ்"></a><a href="README.te.md" title="తెలుగు"><img src="../../assets/languages/te.svg" width="64" height="28" alt="తెలుగు"></a>
</p>
<!-- languages:end -->

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

Untuk versi yang dihosting sendiri, bergabung dengan [kanal pembaruan](https://t.me/sentinelvc) bersifat opsional. Pada bot proyek yang dihosting, ikuti petunjuk /start. Untuk bantuan, gunakan [GitHub Issues](https://github.com/thecmjhb/Sentinel-VC/issues). Kode berlisensi MIT; pertahankan [lisensi](../../LICENSE) dan atribusi.
