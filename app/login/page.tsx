"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import SnowEffect from "@/components/SnowEffect";
import { Copy, Check, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [notFoundMode, setNotFoundMode] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const supportEmail = "kayafurkanipekci@gmail.com";

  // Redirect automatically if an active session cookie exists
  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.user?.username) {
          router.replace(`/dashboard/${encodeURIComponent(data.user.username)}`);
        }
      })
      .catch(() => {
        // Ignore session check failure on login screen
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername || pin.length < 4) {
      setError(t.dashboard.enterPinError);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, pin }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setNotFoundMode(true);
        setShowHelpDrawer(true);
      } else if (res.status === 401) {
        setError(t.login.wrongPin);
        setPin("");
      } else if (!res.ok) {
        setError(t.create.errors.genericError);
      } else {
        router.push(`/dashboard/${encodeURIComponent(data.user.username)}`);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(t.create.errors.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden bg-background">
      <SnowEffect />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md bg-[#f4e4bc] p-8 rounded shadow-2xl border-4 border-[#3e2723]"
      >
        <h1 className="font-cinzel text-3xl text-[#3e2723] text-center font-bold mb-2">{t.login.title}</h1>
        <p className="text-center font-merriweather text-[#5d4037] opacity-80 mb-6 italic text-sm">
          {t.login.subtitle}
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block font-cinzel text-[#3e2723] font-bold mb-2">
              {t.login.usernameLabel}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder={t.login.usernamePlaceholder}
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-3 text-[#3e2723] text-lg font-merriweather outline-none focus:border-[#8b0000] placeholder-amber-900/30"
              required
            />
          </div>

          <div>
            <label htmlFor="pin" className="block font-cinzel text-[#3e2723] font-bold mb-2">
              {t.login.pinLabel}
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ""));
                setError("");
              }}
              placeholder="****"
              style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
              className="w-full bg-[#e6d5aa]/50 border-b-2 border-[#8b7355] p-3 text-center text-2xl tracking-[1em] text-[#3e2723] font-bold outline-none focus:border-[#8b0000] placeholder-amber-900/20"
              required
            />
          </div>

          {error && <p className="text-red-800 font-bold text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-[#3e2723] text-amber-100 font-cinzel font-bold text-lg rounded hover:bg-[#5d4037] transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? t.login.checking : t.login.submit}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setNotFoundMode(false);
            setShowHelpDrawer(true);
          }}
          className="mt-4 text-[#8b7355] text-xs font-merriweather hover:text-[#5d4037] flex items-center justify-center gap-1 w-full"
        >
          <HelpCircle size={12} />
          {t.login.forgotPin}
        </button>

        <div className="mt-6 text-center pt-4 border-t border-[#8b7355]/20">
          <p className="text-[#5d4037] text-sm mb-2 font-merriweather">{t.login.noBoxYet}</p>
          <Link
            href="/create"
            className="text-[#8b0000] font-bold hover:underline font-cinzel text-sm"
          >
            {t.login.createFree}
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-[#8b7355] text-xs hover:text-[#5d4037] font-cinzel">
            ← {t.login.backHome}
          </Link>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHelpDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              onClick={() => setShowHelpDrawer(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#f4e4bc] rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t-4 border-[#8b0000] max-w-lg mx-auto"
            >
              <div className="w-12 h-1 bg-[#8b7355]/30 rounded-full mx-auto mb-6"></div>

              <div className="text-center space-y-4">
                <HelpCircle size={40} className="mx-auto mb-2 text-[#8b0000]" />
                <h3 className="font-cinzel text-xl text-[#3e2723] font-bold">
                  {notFoundMode ? t.login.notFound.title : t.login.forgotPin}
                </h3>

                {notFoundMode && (
                  <>
                    <p className="font-merriweather text-[#5d4037] text-sm">
                      {t.login.notFound.description(username)} <br />
                      {t.login.notFound.wrongSpelling}
                    </p>
                    <div className="flex flex-col gap-3 mt-4">
                      <Link
                        href="/create"
                        className="w-full py-3 bg-[#8b0000] text-white font-cinzel font-bold rounded shadow hover:bg-[#a50000] transition-colors"
                      >
                        {t.login.notFound.createNew}
                      </Link>
                      <button
                        onClick={() => setShowHelpDrawer(false)}
                        className="w-full py-3 bg-[#3e2723] text-[#f4e4bc] font-cinzel font-bold rounded hover:bg-[#5d4037] transition-colors"
                      >
                        {t.login.notFound.tryAgain}
                      </button>
                    </div>
                  </>
                )}

                <div className="relative pt-4 mt-2">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#8b7355]/20"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-[#f4e4bc] px-2 text-xs text-[#8b7355] font-cinzel">
                      {t.login.notFound.helpDivider}
                    </span>
                  </div>
                </div>

                <p className="font-merriweather text-[#5d4037] text-xs">
                  {t.login.notFound.forgotUsernamePrompt}
                </p>

                <div
                  onClick={() => {
                    navigator.clipboard.writeText(supportEmail);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }}
                  className="bg-[#e6d5aa]/50 p-3 rounded border border-[#8b7355]/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="font-mono text-[#3e2723] text-xs">{supportEmail}</span>
                  <div className="text-[#8b0000]">
                    {emailCopied ? <Check size={16} /> : <Copy size={16} />}
                  </div>
                </div>
                {emailCopied && (
                  <p className="text-green-700 text-[10px] font-bold animate-pulse">{t.login.notFound.copied}</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
