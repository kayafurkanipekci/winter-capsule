"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import SnowEffect from "@/components/SnowEffect";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

export default function CreateBox() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: "", pin: "" });
  const [loading, setLoading] = useState(false);
  const [showSuccessDrawer, setShowSuccessDrawer] = useState(false);
  const [createdLink, setCreatedLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleCreate = async () => {
    // Basit kontroller
    if (!formData.username || formData.pin.length < 4) {
      alert("Lütfen geçerli bir isim ve 4 haneli şifre gir.");
      return;
    }

    setLoading(true);

    // 1. Kullanıcı adını olduğu gibi al (büyük/küçük harf koru), sadece baştaki/sondaki boşlukları sil
    const cleanUsername = formData.username.trim();
    // İstersek içindeki boşlukları da silebiliriz ama "Furkan İpekçi" gibi bir isimde boşluk kalsın mı? 
    // Link olacağı için boşlukları silmek veya tireye çevirmek mantıklı ama kullanıcı "otomatik yapmasın" dedi. 
    // Ancak URL'de boşluk sorun olur. Genelde username'de boşluk olmaz.
    // Kullanıcının "ismim Furkan olsun ama link furkan olsun" isteği yok, "isimler hakkında ... büyük harf yapıyor yapmasın" dedi.
    // Ben yine de boşlukları kaldırayım ki URL bozulmasın, ama casing'i koruyayım.
    const finalUsername = cleanUsername.replace(/\s/g, "");

    try {
      // 2. Veritabanına kaydet
      const { error } = await supabase
        .from("users")
        .insert([{ username: finalUsername, pin: formData.pin }]);

      if (error) {
        if (error.code === "23505") {
          alert("Bu isim zaten alınmış! Başka bir tane dene.");
        } else {
          alert("Bir hata oluştu.");
          console.error(error);
        }
        setLoading(false);
        return;
      }

      // 3. Başarılı!
      const link = `${window.location.origin}/${finalUsername}`;
      setCreatedLink(link);
      setShowSuccessDrawer(true);
      setLoading(false);

      // Otomatik kopyala
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        // 3 saniye sonra bildirimi kaldır
        setTimeout(() => setIsCopied(false), 3000);
      }).catch(err => console.error("Kopyalama hatası:", err));

    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    });
  };

  const goToBox = () => {
    // finalUsername state'te yok ama formData'dan alabiliriz veya linkten parse edebiliriz.
    // Link zaten origin + /username formatında.
    // Dashboard'a gitmek için: /dashboard/username
    const username = createdLink.split('/').pop();
    router.push(`/dashboard/${username}`);
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-y-auto bg-background">
      <SnowEffect />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#f4e4bc] p-8 rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] relative"
      >
        {/* Süsleme */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#8b0000] to-transparent opacity-50"></div>

        <h1 className="font-cinzel text-3xl text-[#3e2723] text-center mb-2 font-bold">
          Posta Kutusu Aç
        </h1>
        <p className="text-center font-merriweather text-[#5d4037] text-sm mb-8 italic">
          Kendi adına özel, şifreli bir kutu oluştur.
        </p>

        <div className="space-y-6">

          {/* Kullanıcı Adı */}
          <div>
            <label className="block font-cinzel text-[#3e2723] text-sm mb-1">Kullanıcı Adı (Linkin olacak)</label>
            <input
              type="text"
              placeholder="örn: isminiz"
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 outline-none text-[#3e2723] font-merriweather focus:border-[#8b0000] transition-colors placeholder-[#8b7355]/50"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          {/* Şifre (PIN) */}
          <div>
            <label className="block font-cinzel text-[#3e2723] text-sm mb-1">4 Haneli Gizli Şifren</label>
            <input
              type="text"
              maxLength={4}
              placeholder="****"
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-2 outline-none text-[#3e2723] font-merriweather tracking-[1em] text-center focus:border-[#8b0000] transition-colors placeholder-[#8b7355]/50"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
            />
          </div>

          {/* Buton */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold tracking-wider rounded shadow hover:bg-[#5d4037] disabled:opacity-50 transition-all mt-4"
          >
            {loading ? "Mühürleniyor..." : "KUTUYU OLUŞTUR"}
          </button>

        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-[#8b7355] text-xs hover:text-[#5d4037] font-cinzel">← Ana Sayfaya Dön</Link>
        </div>

      </motion.div>

      {/* SUCCESS DRAWER */}
      <AnimatePresence>
        {showSuccessDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowSuccessDrawer(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000]"
            >
              <div className="w-12 h-1 bg-[#8b7355]/30 rounded-full mx-auto mb-6"></div>

              <div className="text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                  <Check size={32} />
                </div>

                <h2 className="font-cinzel text-2xl text-[#3e2723] font-bold">Kutun Hazır!</h2>
                <p className="font-merriweather text-[#5d4037]">
                  Linkin oluşturuldu ve otomatik olarak kopyalandı.<br />
                  Arkadaşlarına gönderip mesajları toplamaya başla.
                </p>

                {/* Link Kutusu */}
                <div
                  onClick={copyToClipboard}
                  className="bg-[#e6d5aa]/50 p-4 rounded border border-[#8b7355]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="font-mono text-[#3e2723] text-sm truncate mr-4">
                    {createdLink}
                  </span>
                  <div className="text-[#8b0000]">
                    {isCopied ? <Check size={20} /> : <Copy size={20} />}
                  </div>
                </div>

                {isCopied && (
                  <div className="text-green-600 text-sm font-bold animate-pulse">
                    Link Kopyalandı!
                  </div>
                )}

                <button
                  onClick={goToBox}
                  className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded shadow hover:bg-[#5d4037] transition-all"
                >
                  KUTUMA GİT
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
