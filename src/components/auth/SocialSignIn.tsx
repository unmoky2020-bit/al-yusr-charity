import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import type { SocialProvider } from "@/data/laravelApi";
import { useAuthProviders } from "@/hooks/useAuthProviders";
import { useLang } from "@/i18n/LangContext";
import { toast } from "@/lib/notify";

/* Google Identity Services and the Facebook SDK, loaded only when the server has their keys. */
type GoogleId = {
  initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void; ux_mode?: "popup"; context?: string }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
type FacebookSdk = {
  init: (o: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
  login: (cb: (r: { authResponse?: { accessToken?: string } | null }) => void, o: { scope: string }) => void;
};
declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
    FB?: FacebookSdk;
  }
}

const scripts = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  let p = scripts.get(src);
  if (!p) {
    p = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scripts.delete(src);
        reject(new Error(src));
      };
      document.head.appendChild(s);
    });
    scripts.set(src, p);
  }
  return p;
}

function GoogleButton({ clientId, onToken }: { clientId: string; onToken: (t: string) => void }) {
  const { lang } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const handler = useRef(onToken);
  handler.current = onToken;

  useEffect(() => {
    let alive = true;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        const gid = window.google?.accounts?.id;
        if (!alive || !box.current || !gid) return;
        gid.initialize({ client_id: clientId, ux_mode: "popup", context: "signin", callback: (r) => r.credential && handler.current(r.credential) });
        box.current.innerHTML = "";
        gid.renderButton(box.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "center",
          locale: lang,
          width: Math.min(Math.max(box.current.offsetWidth, 220), 400),
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [clientId, lang]);

  return <div ref={box} className="flex min-h-11 w-full justify-center" />;
}

function FacebookButton({ appId, onToken, disabled }: { appId: string; onToken: (t: string) => void; disabled?: boolean }) {
  const { lang } = useLang();
  const [ready, setReady] = useState(false);

  // Loaded up front: FB.login has to run inside the click, or the browser blocks its popup.
  useEffect(() => {
    let alive = true;
    loadScript(`https://connect.facebook.net/${lang === "ar" ? "ar_AR" : "en_US"}/sdk.js`)
      .then(() => {
        if (!alive || !window.FB) return;
        window.FB.init({ appId, cookie: false, xfbml: false, version: "v19.0" });
        setReady(true);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [appId, lang]);

  return (
    <button
      type="button"
      disabled={!ready || disabled}
      onClick={() => window.FB?.login((r) => r.authResponse?.accessToken && onToken(r.authResponse.accessToken), { scope: "email" })}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full bg-[#1877F2] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#166FE5] disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
        <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07" />
      </svg>
      {lang === "ar" ? "المتابعة بحساب فيسبوك" : "Continue with Facebook"}
    </button>
  );
}

/**
 * «المتابعة بجوجل / فيسبوك» for donors. Shows nothing until the server has the keys
 * (GET /auth/providers), so the sign-in page never offers a button that cannot work.
 */
export function SocialSignIn({ onSignedIn }: { onSignedIn?: (created: boolean) => void }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const { loginWithSocial } = useAuth();
  const [busy, setBusy] = useState(false);
  const { providers: data } = useAuthProviders();

  if (!data?.google && !data?.facebook) return null;

  const signIn = async (provider: SocialProvider, token: string) => {
    setBusy(true);
    const res = await loginWithSocial(provider, token);
    setBusy(false);
    if (!res.ok) {
      toast.error(ar ? "تعذّر الدخول" : "Couldn't sign in", { description: res.error });
      return;
    }
    toast.success(res.created ? (ar ? "تم إنشاء حسابك" : "Your account is ready") : ar ? "أهلًا بعودتك" : "Welcome back");
    onSignedIn?.(Boolean(res.created));
  };

  return (
    <div className="space-y-2.5" aria-busy={busy}>
      <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {ar ? "أو" : "or"}
        <span className="h-px flex-1 bg-border" />
      </div>
      {data.google && <GoogleButton clientId={data.google.client_id} onToken={(t) => void signIn("google", t)} />}
      {data.facebook && <FacebookButton appId={data.facebook.app_id} disabled={busy} onToken={(t) => void signIn("facebook", t)} />}
    </div>
  );
}
