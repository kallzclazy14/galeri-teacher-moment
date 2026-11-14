
import React, { useState, useEffect, useMemo } from "react";
import {
  Camera, Heart, Search, Upload, Download, Share2,
  Image as ImageIcon, Info, X, ArrowUpRight,
  Sparkles, Waves, Users, Images, CloudUpload,
  ChevronLeft, Clock, HeartHandshake, Github,
  CheckCircle2, Loader2, Send, Menu
} from "lucide-react";

// ======================================================
// SUPABASE CONFIGURATION
// ======================================================
// Install: npm install @supabase/supabase-js
//
// Isi file .env:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
//
// Bucket: foto-acara
// Table: galeri
//
// Columns:
// id UUID PRIMARY KEY
// created_at TIMESTAMPTZ
// nama_pengirim TEXT
// ucapan TEXT
// image_url TEXT
// likes INTEGER

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const supabase =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

// ======================================================
// SAMPLE DATA
// ======================================================

const initialPhotos = [
  {
    id: "demo-1",
    foto: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=900",
    nama_pengirim: "Panitia Hari Guru",
    ucapan: "Terima kasih kepada seluruh guru yang selalu membimbing kami.",
    likes: 28,
    created_at: "2026-11-13T09:30:00"
  },
  {
    id: "demo-2",
    foto: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900",
    nama_pengirim: "Siswa X BD.2",
    ucapan: "Guru hebat menciptakan generasi yang luar biasa!",
    likes: 42,
    created_at: "2026-11-13T10:00:00"
  },
  {
    id: "demo-3",
    foto: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=900",
    nama_pengirim: "Keluarga SMK ARRAHMAN",
    ucapan: "Sebuah kehormatan bisa merayakan hari istimewa bersama.",
    likes: 35,
    created_at: "2026-11-13T10:15:00"
  },
  {
    id: "demo-4",
    foto: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900",
    nama_pengirim: "OSIS SMK ARRAHMAN",
    ucapan: "Untuk setiap ilmu dan kesabaran, terima kasih guru!",
    likes: 19,
    created_at: "2026-11-13T10:45:00"
  },
  {
    id: "demo-5",
    foto: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=900",
    nama_pengirim: "Peserta Acara",
    ucapan: "Momen sederhana yang akan selalu dikenang.",
    likes: 56,
    created_at: "2026-11-13T11:00:00"
  },
  {
    id: "demo-6",
    foto: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=900",
    nama_pengirim: "Kelas X BD",
    ucapan: "Selamat Hari Guru Nasional. Guru adalah inspirasi!",
    likes: 31,
    created_at: "2026-11-13T11:20:00"
  }
];

// ======================================================
// MAIN COMPONENT
// ======================================================

export default function App() {
  const [photos, setPhotos] = useState(initialPhotos);
  const [page, setPage] = useState("gallery");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("newest");
  const [selected, setSelected] = useState(null);
  const [liked, setLiked] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [splash, setSplash] = useState(true);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    nama_pengirim: "",
    ucapan: "",
    file: null
  });

  const [preview, setPreview] = useState("");

  // Splash animation
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Load Supabase data
  useEffect(() => {
    if (!supabase) return;

    async function loadPhotos() {
      const { data, error } = await supabase
        .from("galeri")
        .select("id,created_at,nama_pengirim,ucapan,image_url,likes")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Gagal memuat galeri Supabase:", error);
        showNotice("Gagal memuat galeri: " + error.message);
        return;
      }

      // UI lama memakai properti `foto`; database memakai `image_url`.
      const normalized = (data || []).map((item) => ({
        ...item,
        foto: item.image_url
      }));

      setPhotos(normalized);
      setSelected((current) => {
        if (!current) return current;
        return normalized.find((item) => item.id === current.id) || current;
      });
    }

    loadPhotos();

    const channel = supabase
      .channel("galeri-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "galeri"
        },
        () => loadPhotos()
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Koneksi realtime Supabase:", status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Search and sorting
  const filteredPhotos = useMemo(() => {
    let result = photos.filter(item =>
      item.nama_pengirim
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    if (filter === "popular") {
      result.sort((a, b) => b.likes - a.likes);
    } else if (filter === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );
    }

    return result;
  }, [photos, query, filter]);

  const totalLikes = photos.reduce(
    (total, item) => total + Number(item.likes || 0), 0
  );

  // Notifications
  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2800);
  }

  // Select image
  function handleFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotice("File harus berupa gambar.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotice("Ukuran gambar maksimal 10 MB.");
      return;
    }

    setForm(prev => ({ ...prev, file }));

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  // Upload photo
  async function handleUpload(e) {
    e.preventDefault();

    if (!form.file || !form.nama_pengirim.trim()) {
      showNotice("Lengkapi foto dan nama pengirim.");
      return;
    }

    setLoading(true);

    try {
      let foto = preview;

      if (supabase) {
        const extension = form.file.name.split(".").pop();
        const filename =
          `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

        const { error: storageError } = await supabase.storage
          .from("foto-acara")
          .upload(filename, form.file, {
            contentType: form.file.type,
            upsert: false
          });

        if (storageError) throw storageError;

        const { data: urlData } = supabase.storage
          .from("foto-acara")
          .getPublicUrl(filename);

        foto = urlData.publicUrl;

        const { data: insertedPhoto, error: insertError } = await supabase
          .from("galeri")
          .insert([{
            image_url: foto,
            nama_pengirim: form.nama_pengirim.trim(),
            ucapan: form.ucapan.trim(),
            likes: 0
          }])
          .select("id,created_at,nama_pengirim,ucapan,image_url,likes")
          .single();

        if (insertError) throw insertError;

        // Tambahkan langsung agar pengunggah tidak perlu menunggu event realtime.
        if (insertedPhoto) {
          setPhotos(prev => [
            { ...insertedPhoto, foto: insertedPhoto.image_url },
            ...prev.filter(item => item.id !== insertedPhoto.id)
          ]);
        }
      } else {
        setPhotos(prev => [{
          id: crypto.randomUUID(),
          foto,
          nama_pengirim: form.nama_pengirim.trim(),
          ucapan: form.ucapan.trim(),
          likes: 0,
          created_at: new Date().toISOString()
        }, ...prev]);
      }

      setForm({
        nama_pengirim: "",
        ucapan: "",
        file: null
      });

      setPreview("");
      setUploadOpen(false);
      showNotice("Momen berhasil ditambahkan!");

    } catch (error) {
      console.error(error);
      showNotice("Upload gagal: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Like photo. RPC mengubah nilai secara atomik agar likes antarperangkat
  // tidak saling menimpa ketika beberapa orang menekan tombol bersamaan.
  async function handleLike(photo) {
    const isLiked = liked.includes(photo.id);
    const delta = isLiked ? -1 : 1;

    // Foto demo hanya berubah secara lokal.
    if (!supabase || String(photo.id).startsWith("demo-")) {
      setLiked(prev =>
        isLiked
          ? prev.filter(id => id !== photo.id)
          : [...prev, photo.id]
      );
      setPhotos(prev => prev.map(item =>
        item.id === photo.id
          ? { ...item, likes: Math.max(0, Number(item.likes || 0) + delta) }
          : item
      ));
      return;
    }

    // UI optimistis; jika RPC gagal, muat ulang data server.
    setLiked(prev =>
      isLiked
        ? prev.filter(id => id !== photo.id)
        : [...prev, photo.id]
    );
    setPhotos(prev => prev.map(item =>
      item.id === photo.id
        ? { ...item, likes: Math.max(0, Number(item.likes || 0) + delta) }
        : item
    ));

    const { error } = await supabase.rpc("ubah_like_galeri", {
      foto_id: photo.id,
      perubahan: delta
    });

    if (error) {
      console.error("Gagal menyimpan like:", error);
      setLiked(prev =>
        isLiked
          ? [...prev, photo.id]
          : prev.filter(id => id !== photo.id)
      );
      showNotice("Gagal menyimpan apresiasi: " + error.message);

      const { data } = await supabase
        .from("galeri")
        .select("id,created_at,nama_pengirim,ucapan,image_url,likes")
        .order("created_at", { ascending: false });

      if (data) {
        setPhotos(data.map(item => ({ ...item, foto: item.image_url })));
      }
    }
  }

  // Download
  async function downloadPhoto(photo) {
    try {
      const response = await fetch(photo.foto);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `SMK-ARRAHMAN-${Date.now()}.jpg`;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      window.open(photo.foto, "_blank");
    }
  }

  // Share
  async function sharePhoto(photo) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Momen Hari Guru - SMK ARRAHMAN",
          text: photo.ucapan,
          url: photo.foto
        });
      } else {
        await navigator.clipboard.writeText(photo.foto);
        showNotice("Link foto berhasil disalin!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showNotice("Tidak dapat membagikan foto.");
      }
    }
  }

  const formatDate = date =>
    new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  // ======================================================
  // SPLASH SCREEN
  // ======================================================

  if (splash) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#041E42] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#0e7490_0%,transparent_55%)] animate-pulse" />

        <div className="relative animate-[intro_1.8s_ease-in-out_forwards] flex flex-col items-center">
          <div className="w-20 h-20 rounded-[26px] border border-white/30 bg-white/10 backdrop-blur-2xl flex items-center justify-center shadow-[0_0_55px_#0ea5e955]">
            <Waves size={42} className="text-cyan-300" />
          </div>

          <h1 className="mt-7 text-xl font-bold tracking-wider">
            SMK ARRAHMAN
          </h1>

          <p className="mt-2 text-sm text-cyan-100/70">
            Galeri Momen Hari Guru
          </p>

          <div className="w-24 h-1 mt-7 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-cyan-300 animate-[loading_1.5s_ease-in-out]" />
          </div>
        </div>

        <style>{`
          @keyframes intro {
            0% { opacity:0; transform:scale(.85); }
            25% { opacity:1; transform:scale(1); }
            75% { opacity:1; }
            100% { opacity:0; transform:scale(1.08); }
          }
          @keyframes loading {
            from { width:0 }
            to { width:100% }
          }
        `}</style>
      </div>
    );
  }

  // ======================================================
  // MAIN UI
  // ======================================================

  return (
    <div className="min-h-screen bg-[#04172F] text-white relative overflow-hidden">

      {/* Oceanic background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[130px]" />
        <div className="absolute top-[35%] right-[-150px] w-[450px] h-[450px] rounded-full bg-teal-400/10 blur-[130px]" />
        <div className="absolute bottom-[-200px] left-[30%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>

      {/* Toast */}
      {notice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[110] px-5 py-3 rounded-2xl border border-white/20 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-sm flex items-center gap-2">
          <CheckCircle2 size={17} className="text-teal-300" />
          {notice}
        </div>
      )}

      <div className="relative z-10 max-w-[1450px] mx-auto min-h-screen flex flex-col lg:flex-row">

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 px-4 sm:px-7 lg:px-10 py-7 lg:py-10 pb-28 lg:pb-10">

          {/* Header */}
          <header className="flex items-center justify-between mb-9">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xl flex items-center justify-center">
                <Waves size={24} className="text-cyan-300" />
              </div>

              <div>
                <h1 className="text-sm font-bold tracking-wide">
                  SMK ARRAHMAN
                </h1>
                <p className="text-[10px] tracking-[2px] text-cyan-100/50 uppercase">
                  Digital Memory Gallery
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 text-[10px] text-teal-300 bg-teal-400/10 border border-teal-400/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-300 animate-pulse" />
                {supabase ? "LIVE CONNECTION" : "DEMO MODE"}
              </span>
            </div>
          </header>

          {/* Hero */}
          {page === "gallery" ? (
            <>
              <section className="relative rounded-[28px] overflow-hidden border border-white/15 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-teal-500/10 backdrop-blur-2xl p-6 sm:p-9 mb-8 shadow-2xl">

                <div className="absolute right-[-25px] top-[-35px] opacity-10">
                  <Waves size={210} />
                </div>

                <div className="relative">
                  <div className="inline-flex items-center gap-2 text-cyan-200 text-[10px] tracking-[2px] uppercase mb-4">
                    <Sparkles size={13} />
                    Special School Celebration
                  </div>

                  <h2 className="text-2xl sm:text-4xl font-bold leading-tight tracking-tight max-w-xl">
                    Perayaan Hari Guru
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-200">
                      Nasional
                    </span>
                  </h2>

                  <p className="text-white/55 text-xs sm:text-sm mt-4 max-w-md leading-relaxed">
                    Abadikan setiap cerita, senyuman, dan kenangan
                    bersama keluarga besar SMK ARRAHMAN.
                  </p>

                  <div className="flex items-center gap-5 mt-7 text-xs text-white/60">
                    <span className="flex items-center gap-2">
                      <Images size={15} className="text-cyan-300" />
                      {photos.length} Momen
                    </span>
                    <span className="flex items-center gap-2">
                      <Heart size={15} className="text-pink-300" />
                      {totalLikes} Apresiasi
                    </span>
                  </div>
                </div>
              </section>

              {/* Gallery heading */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-[10px] text-cyan-300 tracking-[2px] uppercase mb-1">
                    Our Memories
                  </p>
                  <h3 className="text-xl font-semibold">Galeri Momen</h3>
                  <p className="text-xs text-white/40 mt-1">
                    Setiap foto memiliki cerita.
                  </p>
                </div>

                <span className="text-xs text-white/40">
                  {filteredPhotos.length} foto
                </span>
              </div>

              {/* Photo grid */}
              {filteredPhotos.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {filteredPhotos.map((photo, index) => (
                    <article
                      key={photo.id}
                      style={{ animationDelay: `${index * 70}ms` }}
                      className="group rounded-2xl overflow-hidden border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-xl animate-[appear_.5s_ease_both] transition-all duration-300 hover:border-cyan-300/40 hover:-translate-y-1"
                    >
                      <button
                        onClick={() => setSelected(photo)}
                        className="relative w-full aspect-[4/3] block overflow-hidden text-left"
                      >
                        <img
                          src={photo.foto}
                          alt={photo.ucapan}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#04172F]/70 to-transparent opacity-70" />

                        <span className="absolute top-2 left-2 text-[9px] bg-black/35 backdrop-blur-md border border-white/20 rounded-full px-2 py-1 text-white/80">
                          <ImageIcon size={10} className="inline mr-1" />
                          MOMENT
                        </span>

                        <span className="absolute bottom-2 right-2 text-[10px] text-white/80">
                          <ArrowUpRight size={15} />
                        </span>
                      </button>

                      <div className="p-3">
                        <p className="text-xs font-semibold truncate">
                          {photo.nama_pengirim}
                        </p>

                        <p className="text-[10px] text-white/45 mt-1 line-clamp-2 min-h-[30px] leading-relaxed">
                          {photo.ucapan || "Mengabadikan momen indah."}
                        </p>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                          <span className="text-[9px] text-white/35">
                            {formatDate(photo.created_at)}
                          </span>

                          <button
                            onClick={() => handleLike(photo)}
                            className={`flex items-center gap-1.5 text-[11px] transition-all active:scale-125 ${
                              liked.includes(photo.id)
                                ? "text-pink-400"
                                : "text-white/55 hover:text-pink-300"
                            }`}
                          >
                            <Heart
                              size={14}
                              fill={liked.includes(photo.id) ? "currentColor" : "none"}
                            />
                            {photo.likes}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
                  <Images size={35} className="mx-auto text-white/25 mb-3" />
                  <p className="text-sm text-white/60">Foto tidak ditemukan.</p>
                </div>
              )}
            </>
          ) : (

            // ABOUT PAGE
            <section className="space-y-5">
              <div className="mb-8">
                <p className="text-[10px] tracking-[2px] text-cyan-300 uppercase mb-2">
                  About Project
                </p>
                <h2 className="text-3xl font-bold">Tentang Aplikasi</h2>
                <p className="text-sm text-white/45 mt-2">
                  Mengenal lebih dekat Galeri Momen Hari Guru.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-300/20 flex items-center justify-center mb-5">
                  <Waves className="text-cyan-300" size={25} />
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  Galeri Digital Hari Guru
                </h3>

                <p className="text-sm text-white/55 leading-7">
                  Galeri ini dibuat sebagai ruang digital untuk
                  menyimpan, mengabadikan, dan membagikan momen
                  spesial Perayaan Hari Guru Nasional di SMK
                  ARRAHMAN. Setiap foto menjadi bagian dari
                  kenangan dan apresiasi kepada seluruh guru.
                </p>
              </div>

              <div className="rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl p-6">
                <h3 className="font-semibold mb-5 flex items-center gap-2">
                  <Camera size={18} className="text-cyan-300" />
                  Panduan Penggunaan
                </h3>

                {[
                  ["01", "Unggah Momen", "Klik tombol Unggah Momen, pilih foto dari kamera atau galeri."],
                  ["02", "Tambahkan Cerita", "Isi nama pengirim dan ucapan singkat untuk foto."],
                  ["03", "Bagikan Kenangan", "Buka foto untuk mengunduh atau membagikannya."],
                  ["04", "Berikan Apresiasi", "Klik ikon hati untuk memberikan like pada foto."]
                ].map(item => (
                  <div key={item[0]} className="flex gap-4 mb-5 last:mb-0">
                    <div className="text-cyan-300 text-sm font-bold">{item[0]}</div>
                    <div>
                      <h4 className="text-sm font-medium">{item[1]}</h4>
                      <p className="text-xs text-white/45 mt-1 leading-relaxed">{item[2]}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 backdrop-blur-xl p-6">
                <p className="text-[10px] tracking-[2px] uppercase text-cyan-300 mb-3">
                  Developer Profile
                </p>

                <h3 className="text-xl font-bold">Oka Alamsyah</h3>
                <p className="text-xs text-white/45 mt-1">
                  Student • Web Designer • Developer
                </p>

                <p className="text-sm text-white/60 mt-4 leading-6">
                  Dikembangkan dengan semangat kreativitas dan
                  teknologi untuk menghadirkan pengalaman
                  dokumentasi acara sekolah yang modern,
                  interaktif, dan mudah digunakan.
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  {["React", "Tailwind CSS", "Lucide React", "Supabase"].map(tech => (
                    <span key={tech} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-cyan-100">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-white/55 font-medium">
              SMK ARRAHMAN <span className="text-cyan-300">•</span> Dikembangkan oleh Oka Alamsyah
            </p>
            <p className="text-[10px] text-white/30 mt-2">
              Made with creativity & technology.
            </p>
            <p className="text-[9px] text-white/20 mt-3 tracking-widest">
              TEACHER'S DAY DIGITAL GALLERY
            </p>
          </footer>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="hidden lg:flex w-[285px] shrink-0 p-5 pl-0">
          <div className="sticky top-5 h-[calc(100vh-40px)] w-full rounded-[28px] border border-white/15 bg-white/[0.07] backdrop-blur-2xl shadow-2xl p-5 flex flex-col">

            <div className="flex items-center gap-3 pb-6 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/30 to-teal-400/10 border border-white/20 flex items-center justify-center">
                <Waves className="text-cyan-300" size={22} />
              </div>
              <div>
                <p className="text-sm font-bold">Gallery Dock</p>
                <p className="text-[10px] text-white/40">SMK ARRAHMAN</p>
              </div>
            </div>

            <p className="text-[9px] text-white/35 tracking-[2px] uppercase mt-7 mb-3">
              Main Navigation
            </p>

            <button
              onClick={() => setPage("gallery")}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs transition-all ${
                page === "gallery"
                  ? "bg-cyan-400/15 text-cyan-200 border border-cyan-300/20"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              <Images size={17} />
              Lihat Galeri
            </button>

            <button
              onClick={() => setPage("about")}
              className={`flex items-center gap-3 p-3 rounded-xl text-xs mt-1 transition-all ${
                page === "about"
                  ? "bg-cyan-400/15 text-cyan-200 border border-cyan-300/20"
                  : "text-white/55 hover:bg-white/5"
              }`}
            >
              <Info size={17} />
              Tentang Aplikasi
            </button>

            <div className="mt-7">
              <button
                onClick={() => setUploadOpen(true)}
                className="w-full rounded-xl p-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold flex justify-center items-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[.98] transition"
              >
                <Upload size={16} />
                Unggah Momen
              </button>
            </div>

            <div className="mt-7">
              <p className="text-[9px] text-white/35 tracking-[2px] uppercase mb-3">
                Discover
              </p>

              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setPage("gallery");
                  }}
                  placeholder="Cari nama pengirim..."
                  className="w-full rounded-xl bg-white/[0.07] border border-white/10 py-3 pl-9 pr-3 text-[11px] outline-none focus:border-cyan-300/50 placeholder:text-white/25"
                />
              </div>

              <div className="mt-4 space-y-1">
                {[
                  ["all", "Semua Foto"],
                  ["popular", "Terpopuler"],
                  ["newest", "Terbaru"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setFilter(value);
                      setPage("gallery");
                    }}
                    className={`w-full text-left text-xs px-3 py-2.5 rounded-lg transition ${
                      filter === value
                        ? "text-cyan-200 bg-white/10"
                        : "text-white/45 hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3">
                <Images size={16} className="text-cyan-300 mb-2" />
                <p className="text-lg font-semibold">{photos.length}</p>
                <p className="text-[9px] text-white/40">Total Foto</p>
              </div>

              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3">
                <Heart size={16} className="text-pink-300 mb-2" />
                <p className="text-lg font-semibold">{totalLikes}</p>
                <p className="text-[9px] text-white/40">Apresiasi</p>
              </div>
            </div>

            <div className="mt-auto pt-5 border-t border-white/10">
              <p className="text-[10px] text-white/40">
                Digital Gallery Project
              </p>
              <p className="text-xs font-medium mt-1">
                Oka Alamsyah
              </p>
              <p className="text-[9px] text-cyan-300/60 mt-1">
                SMK ARRAHMAN © 2026
              </p>
            </div>
          </div>
        </aside>

        {/* MOBILE BOTTOM NAV */}
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 rounded-2xl border border-white/20 bg-[#092c48]/85 backdrop-blur-2xl shadow-2xl p-2 flex items-center justify-around">
          <button
            onClick={() => setPage("gallery")}
            className={`flex flex-col items-center gap-1 p-2 text-[9px] ${
              page === "gallery" ? "text-cyan-300" : "text-white/50"
            }`}
          >
            <Images size={19} />
            Galeri
          </button>

          <button
            onClick={() => setUploadOpen(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 -mt-5 border-4 border-[#092c48]"
          >
            <Upload size={20} />
          </button>

          <button
            onClick={() => setPage("about")}
            className={`flex flex-col items-center gap-1 p-2 text-[9px] ${
              page === "about" ? "text-cyan-300" : "text-white/50"
            }`}
          >
            <Info size={19} />
            Tentang
          </button>
        </div>
      </div>

      {/* =================================================
          UPLOAD MODAL
      ================================================= */}

      {uploadOpen && (
        <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#09243c]/95 border border-white/20 shadow-2xl p-6 animate-[modal_.25s_ease-out]">

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-cyan-300 uppercase tracking-widest">
                  Share Your Memory
                </p>
                <h3 className="text-lg font-bold mt-1">Unggah Momen</h3>
              </div>
              <button
                onClick={() => setUploadOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-white/60"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">

              <label className="block">
                <div className={`relative rounded-2xl border border-dashed ${
                  preview ? "border-cyan-300/50" : "border-white/25"
                } bg-white/[0.04] overflow-hidden aspect-video flex flex-col items-center justify-center cursor-pointer`}>
                  {preview ? (
                    <img src={preview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <CloudUpload size={32} className="text-cyan-300 mb-3" />
                      <p className="text-xs font-medium">Pilih Foto</p>
                      <p className="text-[10px] text-white/35 mt-1">
                        Kamera atau galeri perangkat
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => handleFile(e.target.files?.[0])}
                  className="hidden"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="rounded-xl border border-white/15 bg-white/5 p-3 flex items-center justify-center gap-2 text-xs cursor-pointer hover:bg-white/10">
                  <Camera size={16} className="text-cyan-300" />
                  Kamera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={e => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>

                <label className="rounded-xl border border-white/15 bg-white/5 p-3 flex items-center justify-center gap-2 text-xs cursor-pointer hover:bg-white/10">
                  <Images size={16} className="text-cyan-300" />
                  Galeri
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFile(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Nama Pengirim
                </label>
                <input
                  required
                  maxLength={60}
                  value={form.nama_pengirim}
                  onChange={e => setForm({
                    ...form,
                    nama_pengirim: e.target.value
                  })}
                  placeholder="Masukkan nama kamu..."
                  className="w-full rounded-xl bg-white/[0.07] border border-white/15 px-4 py-3 text-sm outline-none focus:border-cyan-300/50"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 mb-2 block">
                  Ucapan / Cerita
                </label>
                <textarea
                  maxLength={250}
                  value={form.ucapan}
                  onChange={e => setForm({
                    ...form,
                    ucapan: e.target.value
                  })}
                  placeholder="Tuliskan cerita atau ucapan kamu..."
                  rows={3}
                  className="w-full resize-none rounded-xl bg-white/[0.07] border border-white/15 px-4 py-3 text-sm outline-none focus:border-cyan-300/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 p-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {loading ? "Mengunggah..." : "Publikasikan Momen"}
              </button>

              <p className="text-[9px] text-white/30 text-center">
                Pastikan foto yang diunggah pantas untuk galeri sekolah.
              </p>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          PHOTO LIGHTBOX
      ================================================= */}

      {selected && (
        <div
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-3xl rounded-[26px] border border-white/20 bg-[#09243c]/95 overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <p className="text-xs font-semibold">{selected.nama_pengirim}</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {formatDate(selected.created_at)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-black/20 flex items-center justify-center max-h-[65vh]">
              <img
                src={selected.foto}
                className="max-h-[65vh] max-w-full object-contain"
              />
            </div>

            <div className="p-4">
              <p className="text-sm text-white/75 leading-relaxed">
                {selected.ucapan}
              </p>

              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  onClick={() => downloadPhoto(selected)}
                  className="flex-1 min-w-[130px] rounded-xl bg-white/10 border border-white/15 p-3 text-xs flex items-center justify-center gap-2 hover:bg-white/15"
                >
                  <Download size={15} />
                  Download Foto
                </button>

                <button
                  onClick={() => sharePhoto(selected)}
                  className="flex-1 min-w-[130px] rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 p-3 text-xs flex items-center justify-center gap-2"
                >
                  <Share2 size={15} />
                  Share Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes appear {
          from { opacity:0; transform:translateY(15px); }
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes modal {
          from { opacity:0; transform:scale(.96) translateY(10px); }
          to { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}