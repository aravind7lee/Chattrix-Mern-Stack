// src/pages/LoginPage.jsx
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

/* Utility: simple email regex */
const EMAIL_RE = /^\S+@\S+\.\S+$/;

/* Password strength / suggestions */
function passwordStrength(password) {
  if (!password) return { score: 0, label: "Very Weak" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  let label = "Very Weak";
  if (score >= 3) label = "Strong";
  else if (score === 2) label = "Medium";
  else if (score === 1) label = "Weak";
  return { score, label };
}

function passwordSuggestions(password) {
  const suggestions = [];
  if (!password || password.length < 8) suggestions.push("Use 8+ characters");
  if (!/[A-Z]/.test(password)) suggestions.push("Add an uppercase letter");
  if (!/[0-9]/.test(password)) suggestions.push("Add a number");
  if (!/[^A-Za-z0-9]/.test(password)) suggestions.push("Add a special character");
  return suggestions;
}

/* Small UI helper for visual strength pips */
const StrengthPips = ({ password }) => {
  const { score } = passwordStrength(password);
  const pips = [1, 2, 3, 4];
  return (
    <div className="flex items-center gap-1">
      {pips.map((p) => {
        const active = score >= p;
        const color =
          score >= 3 ? "bg-emerald-400" : score === 2 ? "bg-yellow-400" : score === 1 ? "bg-rose-400" : "bg-white/6";
        return <span key={p} className={`w-2.5 h-2.5 rounded ${active ? color : "bg-white/6"}`} />;
      })}
    </div>
  );
};

const LoginPage = () => {
  // auth state
  const { login } = useContext(AuthContext);

  // form state
  const [currState, setCurrState] = useState("Sign up");
  const isSignup = currState === "Sign up";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  // UI state
  const [isDataSubmitted, setIsDataSubmitted] = useState(false); // step toggle
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // validation state
  const [emailError, setEmailError] = useState("");
  const [fullNameError, setFullNameError] = useState("");

  // responsive breakpoint: desktop >= 768px (tablet)
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width:768px)").matches : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.matchMedia("(min-width:768px)").matches);
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // measured wrapper for smooth height transitions
  const wrapperRef = useRef(null);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);

  const measureActive = (animate = true) => {
    const active = isDataSubmitted ? step2Ref.current : step1Ref.current;
    if (!active || !wrapperRef.current) return;
    const newH = active.scrollHeight;
    // set immediate height then allow transition
    wrapperRef.current.style.height = `${newH}px`;
    wrapperRef.current.style.transition = animate ? "height 360ms cubic-bezier(.16,.84,.26,1)" : "none";
  };

  useLayoutEffect(() => {
    // measure initial and after a tick to allow animation
    measureActive(false);
    const t = setTimeout(() => measureActive(true), 20);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDataSubmitted, isDesktop]);

  useEffect(() => {
    const onResize = () => measureActive(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* Validation helpers */
  const validateStep1 = () => {
    let ok = true;
    setEmailError("");
    setFullNameError("");
    if (isSignup && fullName.trim().length < 2) {
      setFullNameError("Please enter your full name.");
      ok = false;
    }
    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address.");
      ok = false;
    }
    const { score } = passwordStrength(password);
    if (isSignup && score < 2) {
      // require at least medium to proceed
      toast.error("Choose a stronger password (min: medium).");
      ok = false;
    }
    return ok;
  };

  const validateBeforeSend = () => {
    setEmailError("");
    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address.");
      return false;
    }
    if (!password) {
      toast.error("Enter your password.");
      return false;
    }
    return true;
  };

  /* Submit handler */
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    // Step progression for signup
    if (isSignup && !isDataSubmitted) {
      const ok = validateStep1();
      if (!ok) {
        measureActive();
        return;
      }
      setIsDataSubmitted(true);
      // focus bio
      setTimeout(() => {
        step2Ref.current?.querySelector("textarea")?.focus();
        measureActive();
      }, 150);
      return;
    }

    // final submission
    if (!validateBeforeSend()) return;

    setIsSubmitting(true);
    try {
      await login(isSignup ? "signup" : "login", {
        fullName,
        email,
        password,
        bio,
      });

      if (isSignup) {
        // show success micro-interaction briefly
        setShowSuccess(true);
        await new Promise((r) => setTimeout(r, 900));
        setShowSuccess(false);
      }
      // AuthContext.login should handle token/navigation as before
    } catch (err) {
      toast.error(err?.message || "Action failed. Check credentials or network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* classes for transitions:
     - Desktop: slide-left (step1 moves left out, step2 comes from right)
     - Mobile: slide-up (step1 moves up/out, step2 comes from bottom)
  */
  const step1OutClass = isDesktop ? "-translate-x-6 opacity-0 pointer-events-none" : "-translate-y-4 opacity-0 pointer-events-none";
  const step1InClass = "translate-x-0 translate-y-0 opacity-100 pointer-events-auto";

  const step2InClass = isDesktop ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-y-0 opacity-100 pointer-events-auto";
  const step2OutClass = isDesktop ? "translate-x-6 opacity-0 pointer-events-none" : "translate-y-4 opacity-0 pointer-events-none";

  /**
   * IMPORTANT: global style adjustments to avoid white gaps / overflow on mobile.
   * We set document/body margins and overflow-x here and restore on cleanup.
   */
  useEffect(() => {
    const docEl = document.documentElement;
    const body = document.body;
    const prevOverflowX = docEl.style.overflowX;
    const prevBodyMargin = body.style.margin;
    const prevBodyBg = body.style.background;

    // Prevent horizontal overflow (prevents right-edge white bar)
    docEl.style.overflowX = "hidden";

    // Remove default margin (browsers often add 8px) so layout touches edges
    body.style.margin = "0";

    // Ensure the page background is dark so you won't see white stripes in the viewport
    body.style.background = "radial-gradient(circle at 30% 10%, rgba(124,58,237,0.06), rgba(79,70,229,0.03) 30%, #0b0b0f 100%)";

    return () => {
      docEl.style.overflowX = prevOverflowX;
      body.style.margin = prevBodyMargin;
      body.style.background = prevBodyBg;
    };
  }, []);

  return (
    <div
      className="app-root min-h-screen w-screen flex flex-col sm:flex-row items-center justify-center gap-8 sm:justify-evenly overflow-hidden"
      // respect safe-area insets for mobile notches
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="w-full max-w-[980px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-4 py-8">
        {/* Left: Branding / info */}
        <aside className="col-span-12 lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left gap-4 sm:gap-6 px-2">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16">
              <img src={assets.logo_icon || assets.logo_big} alt="logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight">Chattrix</h1>
              <p className="text-sm text-white/70 mt-0.5">A modern chat experience — fast, private & beautiful.</p>
            </div>
          </div>
        </aside>

        {/* Right: Auth form */}
        <main className="col-span-12 lg:col-span-6 flex items-center justify-center px-2">
          <form
            onSubmit={onSubmitHandler}
            autoComplete="on"
            method="post"
            aria-label={isSignup ? "Sign up form" : "Login form"}
            className="relative w-full max-w-md p-4 sm:p-6 md:p-8 rounded-2xl bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] border border-white/10 backdrop-blur-xl shadow-2xl"
            // ensure box sizing includes padding within width on small screens
            style={{ boxSizing: "border-box" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg sm:text-2xl font-semibold text-white">{currState}</h3>
                <p className="text-xs text-white/60 mt-1">
                  {isSignup ? (isDataSubmitted ? "One more step — add a short bio." : "Create your account to get started.") : "Sign in to continue your conversations."}
                </p>
              </div>

              {isDataSubmitted ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDataSubmitted(false);
                    setEmailError("");
                    setFullNameError("");
                    measureAfterTick(measureActive);
                  }}
                  className="p-1.5 sm:p-2 rounded-md hover:bg-white/6 transition focus:outline-none"
                  aria-label="Back to previous step"
                >
                  <img src={assets.arrow_icon} alt="Back" className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <div className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>

            <div className="mb-3 border-t border-white/6" />

            {/* Steps wrapper - measured height */}
            <div ref={wrapperRef} className="relative overflow-hidden" style={{ height: "auto" }}>
              {/* Step 1 */}
              <div
                ref={step1Ref}
                className={`relative transition-all duration-360 ease-[cubic-bezier(.16,.84,.26,1)] ${isDataSubmitted ? step1OutClass : step1InClass}`}
                aria-hidden={isDataSubmitted}
              >
                {/* Full name (signup only) */}
                {isSignup && (
                  <div className="mb-3">
                    <label htmlFor="fullName" className="text-xs text-white/60 uppercase tracking-wider">Full name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (e.target.value.trim().length >= 2) setFullNameError("");
                      }}
                      type="text"
                      autoComplete="name"
                      placeholder="Your full name"
                      required={isSignup}
                      className="mt-2 w-full p-3 rounded-xl bg-white/5 placeholder-white/40 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-400/30 transition"
                      aria-invalid={!!fullNameError}
                    />
                    {fullNameError && <p className="mt-1 text-xs text-rose-300">{fullNameError}</p>}
                  </div>
                )}

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="text-xs text-white/60 uppercase tracking-wider">Email</label>
                  <input
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (EMAIL_RE.test(e.target.value)) setEmailError("");
                    }}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="mt-2 w-full p-3 rounded-xl bg-white/5 placeholder-white/40 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-400/30 transition"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                  />
                  {emailError ? (
                    <p id="email-error" className="mt-1 text-xs text-rose-300">{emailError}</p>
                  ) : (
                    <p className="mt-1 text-xs text-white/50">We'll never share your email.</p>
                  )}
                </div>

                {/* Password + strength + suggestions */}
                <div className="mb-3">
                  <label htmlFor="password" className="text-xs text-white/60 uppercase tracking-wider">Password</label>
                  <input
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    required
                    className="mt-2 w-full p-3 rounded-xl bg-white/5 placeholder-white/40 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-400/30 transition"
                    aria-describedby="password-hint"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StrengthPips password={password} />
                      <p id="password-hint" className="text-xs text-white/50">{password ? passwordStrength(password).label : "Password strength"}</p>
                    </div>
                    <p className="text-xs text-white/40">Min 8 chars recommended</p>
                  </div>

                  {/* suggestions */}
                  {password && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {passwordSuggestions(password).slice(0, 4).map((s, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 rounded bg-white/5 text-white/70">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 (bio) */}
              <div
                ref={step2Ref}
                className={`absolute inset-0 left-0 right-0 transition-all duration-360 ease-[cubic-bezier(.16,.84,.26,1)] ${isDataSubmitted ? step2InClass : step2OutClass}`}
                aria-hidden={!isDataSubmitted}
              >
                <div className="mb-3">
                  <label htmlFor="bio" className="text-xs text-white/60 uppercase tracking-wider">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Tell us a little about yourself..."
                    required={isSignup}
                    className="mt-2 w-full p-3 rounded-xl bg-white/5 placeholder-white/40 border border-white/10 text-white outline-none focus:ring-2 focus:ring-indigo-400/30 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input id="terms" name="terms" type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
                <span>Agree to terms</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold text-sm transition ${isSubmitting ? "opacity-80 cursor-wait" : "hover:scale-[1.02]"}`}
                style={{ background: "linear-gradient(90deg,#7c3aed,#4f46e5)", boxShadow: "0 6px 18px rgba(79,70,229,0.18)" }}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2 text-white" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                      <path d="M22 12a10 10 0 00-10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span className="text-white">{isSignup ? "Creating..." : "Signing in..."}</span>
                  </>
                ) : (
                  <span className="text-white">{isSignup ? "Create Account" : "Login"}</span>
                )}
              </button>
            </div>

            {/* Bottom switch */}
            <div className="mt-4 text-center text-xs sm:text-sm text-white/70">
              {isSignup ? (
                <p>
                  Already have an account?
                  <button
                    type="button"
                    onClick={() => { setCurrState("Login"); setIsDataSubmitted(false); setEmailError(""); setFullNameError(""); }}
                    className="ml-2 font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    Login here
                  </button>
                </p>
              ) : (
                <p>
                  New here?
                  <button
                    type="button"
                    onClick={() => { setCurrState("Sign up"); setIsDataSubmitted(false); }}
                    className="ml-2 font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>

            {/* Submission overlay */}
            {isSubmitting && (
              <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-black/30">
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-10 h-10 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                    <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <div className="text-white text-sm">{isSignup ? "Creating account…" : "Signing in…"}</div>
                </div>
              </div>
            )}

            {/* Success micro-interaction */}
            {showSuccess && (
              <div className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl bg-black/50">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/95 flex items-center justify-center shadow-lg animate-scale-up">
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="text-white font-medium">Account created</div>
                </div>
              </div>
            )}
          </form>
        </main>
      </div>

      <style>{`
        /* small keyframe for success micro-interaction */
        @keyframes scaleUp {
          0% { transform: scale(.8); opacity: 0; }
          60% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up { animation: scaleUp 420ms cubic-bezier(.2,.9,.2,1) both; }

        /* Ensure consistent box-sizing and prevent horizontal overflow */
        html, body, #root { height: 100%; margin: 0; }
        * { box-sizing: border-box; }

        /* mobile: prefer slightly smaller form padding to fit narrow screens */
        @media (max-width: 767px) {
          form { padding: 14px; }
        }
      `}</style>
    </div>
  );
};

/* helper to measure after a tick (used by back button) */
function measureAfterTick(cb) {
  setTimeout(() => {
    if (typeof cb === "function") cb();
  }, 24);
}

export default LoginPage;
