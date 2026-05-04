# 07 - Web Dashboard Component Map

Dokumen ini dipakai sebagai kamus cepat saat memberi instruksi ke AI untuk perubahan UI dashboard.
Gunakan nama komponen yang ada di sini supaya permintaan lebih spesifik dan mudah dieksekusi.

---

## Cara Memakai

Saat meminta perubahan, sebutkan:

1. Nama komponen atau halaman
2. Bagian yang ingin diubah
3. Perilaku yang diharapkan
4. Ruang lingkup yang tidak boleh berubah

Contoh:

```text
Update DetailPageTemplate: sidebar menu harus jadi section navigation, dan tab di kanan menjadi submenu dari section aktif.
```

---

## Layout Utama

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `AppShell` | Wadah utama semua halaman authenticated | Saat perlu mengubah struktur umum halaman app |
| `AppNavbar` | Navigasi utama atas/kiri sesuai konteks | Saat perlu menambah menu utama, ikon, atau active state |
| `SecondaryNav` | Navigasi sekunder di bawah navbar utama | Saat perlu menambah nav2, konteks, atau active state halaman |
| `PageHeader` | Header halaman generik | Saat perlu menyesuaikan judul, breadcrumb, pills, atau action bar |
| `PageWrapper` | Pembungkus konten halaman dengan loading/error state | Saat perlu mengubah state loading, error, atau retry |

---

## Page Template

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `ListPageTemplate` | Template halaman daftar / table | Saat halaman berisi tabel, filter, search, add button, dan aksi baris |
| `DetailPageTemplate` | Template halaman detail | Saat halaman berisi header identitas, progress, menu kiri, submenu/tab kanan, action overflow, dan sidebar koneksi |
| `FormPageTemplate` | Template halaman create/edit form | Saat halaman berisi tabs form, submit bar, validasi, dan help modal |
| `DomainPageTemplate` | Template detail domain yang lebih kaya | Saat butuh status flow, summary strip, related docs, dan activity log |

### DetailPageTemplate

Pola sekarang:

| Bagian | Peran |
|--------|-------|
| Header card | Breadcrumb, title, code, badge, action button, help icon |
| Progress card | Progress stepper di bawah header |
| Sidebar menu card | Section navigation di kiri |
| Koneksi section | Section navigation khusus untuk relasi data / DataConnectionWidget |
| Main content card | Submenu tabs di kanan dan isi tab aktif |

Kalimat prompt yang baik:

```text
Ubah DetailPageTemplate supaya menu kiri tetap sebagai parent section, sementara tabs di kanan menjadi submenu dari section aktif.
```

### FormPageTemplate

Pola sekarang:

| Bagian | Peran |
|--------|-------|
| Header card | Breadcrumb, title, code, badge, help icon |
| Tabs card | Subsection form di dalam card utama |
| Submit bar | Tombol batal/simpan dan extra actions |

---

## Widgets Inti

### Data

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `DataTable` | Tabel data dengan sort, search, filter, pagination, row action | Saat perlu mengubah header/footer table, toolbar, row action, atau pagination. Sort dan filter query params memakai tuple array: `sort=[['field', 1], ['field2', -1]]`, `filters=[['field', 'operator', value]]` |
| `ProgressWidget` | Stepper/status progression | Saat perlu menampilkan alur status atau tahapan kerja |
| `DataConnectionWidget` | Tampilan koneksi / relasi data | Saat detail page butuh daftar koneksi atau relasi |

### Navigasi dan Struktur

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `Tabs` | Tab umum dengan style sederhana | Saat butuh tab non-template |
| `Breadcrumb` | Breadcrumb generik | Saat perlu breadcrumb di luar template |
| `SectionCard` | Card section yang berdiri sendiri | Saat perlu blok konten berjudul di dalam halaman |
| `ActionMenu` | Menu aksi dropdown | Saat perlu dropdown aksi dengan trigger terpisah |
| `Drawer` | Panel samping | Saat butuh panel geser dari samping |

### Status, Umpan Balik, dan Keamanan

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `StatusPills` | Badge status readonly / managed by HQ | Saat halaman perlu menandai mode akses |
| `Badge` / `StatusBadge` | Label status generik | Saat butuh chip/status kecil |
| `Toast` | Notifikasi sementara | Saat perlu pesan sukses/error/info |
| `ConfirmDialog` | Konfirmasi aksi penting | Saat perlu hapus, batal, atau aksi destruktif |
| `ErrorBoundary` | Fallback error UI | Saat perlu menangani error render |
| `PermissionGate` | Gate akses berbasis permission | Saat perlu sembunyikan atau lindungi konten |

### Form Inputs

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `SearchableSelect` | Select dengan pencarian | Saat pilihan banyak dan perlu filter cepat |
| `DatePicker` | Pilih tanggal | Saat butuh input tanggal tunggal |
| `DateRangePicker` | Pilih rentang tanggal | Saat perlu filter tanggal dari-sampai |
| `NumberInput` | Input angka terformat | Saat nilai numerik perlu kontrol lebih ketat |
| `RangeInput` | Slider/range | Saat butuh nilai min-max atau pengaturan rentang |
| `MultiSelect` | Pilih banyak opsi | Saat satu field bisa punya banyak item |
| `CheckboxGroup` | Grup checkbox | Saat perlu opsi multi-pilih sederhana |
| `RadioGroup` | Grup radio | Saat hanya satu opsi boleh dipilih |
| `Switch` | Toggle on/off | Saat field binary perlu kontrol jelas |
| `TagInput` | Input tag/label | Saat data berupa daftar keyword |
| `InlineEditField` | Edit nilai langsung di tempat | Saat konten perlu diedit tanpa pindah form |
| `FileUpload` | Upload file tunggal | Saat form butuh file input |
| `MultiFileUploadField` | Upload banyak file dalam satu field | Saat form butuh lampiran lebih dari satu file |

### Visual / Supporting

| Komponen | Fungsi | Kapan dipakai |
|----------|--------|---------------|
| `ChartWidget` | Grafik dan insight | Saat perlu menampilkan visual data |
| `ChartCard` | Card pembungkus grafik | Saat grafik butuh container konsisten |
| `StatCard` | KPI / ringkasan angka | Saat perlu angka utama di dashboard |
| `QuickLinkCard` | Shortcut ke halaman lain | Saat perlu kartu navigasi cepat |
| `EmptyState` | State kosong | Saat data belum ada |
| `LoadingBar` | Indikator loading global | Saat request sedang berjalan |
| `Skeleton` | Placeholder loading | Saat konten belum siap |
| `Timeline` | Kronologi event | Saat menampilkan aktivitas berurutan |
| `FlowWidget` | Flow / step visualization | Saat perlu alur proses dengan info tambahan |
| `HierarchyTree` | Struktur pohon data | Saat menampilkan parent-child / organisasi |
| `ReportIndexCard` | Kartu index laporan | Saat membangun landing/report index |
| `Avatar` / `AvatarGroup` | Identitas visual user | Saat menampilkan user atau grup |

---

## Halaman Contoh

| Halaman | Tujuan |
|---------|--------|
| `DashboardPage` | Contoh halaman utama yang full width dan responsif |
| `ExamplesListPage` | Contoh `ListPageTemplate` |
| `WidgetGalleryPage` | Contoh halaman galeri widget satu halaman |
| `ExampleDetailPage` | Contoh `DetailPageTemplate` |
| `ExampleFormPage` | Contoh `FormPageTemplate` |

---

## Kata Kunci Prompt Yang Disarankan

Pakai istilah ini saat memberi instruksi:

- `layout`
- `section navigation`
- `submenu tabs`
- `active state`
- `table header`
- `table footer`
- `help modal`
- `overflow menu`
- `responsive stacking`
- `full width`

Contoh instruksi yang jelas:

```text
Update DataTable: make the table header and footer colors stronger, but keep the rest of the table behavior the same.
```

```text
Update DetailPageTemplate: left sidebar is the section navigation, right card tabs are the submenu of the active section.
```

---

## Rekomendasi Untuk Prompting

Kalau ingin hasil yang konsisten, sebutkan komponen langsung daripada mendeskripsikan tampilan dari nol.

Contoh yang lebih baik:

- `Update SecondaryNav active state on nested routes`
- `Update DetailPageTemplate section navigation`
- `Update ListPageTemplate header actions`
- `Update DataTable footer colors`

Contoh yang terlalu umum:

- `make it better`
- `fix the page`
- `improve the UI`
