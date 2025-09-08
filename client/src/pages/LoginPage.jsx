import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    // Two-step sign-up flow: first submit will switch to bio step,
    // second submit will execute the signup.
    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    // Keep your original API shape: login(mode, payload)
    login(currState === "Sign up" ? "signup" : "login", {
      fullName,
      email,
      password,
      bio,
    });
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">
      {/* Left: Logo */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <img src={assets.logo_big} alt="Chattrix logo" className="w-[min(30vw,250px)] drop-shadow" />
        <p className="mt-6 text-sm text-white/70 max-w-sm">
          Welcome back to <span className="text-white">Chattrix</span>. Stay connected with a fast, secure, and modern chat experience.
        </p>
      </div>

      {/* Right: Auth Form */}
      <form
        autoComplete="on"
        onSubmit={onSubmitHandler}
        className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 text-white w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{currState}</h2>
            <p className="text-xs text-white/60 mt-1">
              {currState === "Sign up"
                ? isDataSubmitted
                  ? "Tell us a bit about yourself."
                  : "Create your account to get started."
                : "Log in to continue your conversations."}
            </p>
          </div>

          {isDataSubmitted ? (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt="Back"
              className="w-6 h-6 cursor-pointer opacity-90 hover:opacity-100 transition"
            />
          ) : (
            <span className="w-6 h-6" />
          )}
        </div>

        {/* Full Name (Sign up step 1) */}
        {currState === "Sign up" && !isDataSubmitted ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="fullName" className="text-xs uppercase tracking-wider text-white/60">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              required
              className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 transition"
            />
          </div>
        ) : null}

        {/* Email + Password */}
        {!isDataSubmitted ? (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs uppercase tracking-wider text-white/60">
                Email
              </label>
              <input
                id="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 transition"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs uppercase tracking-wider text-white/60">
                Password
              </label>
              <input
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                // Choose autocomplete token depending on the mode:
                autoComplete={currState === "Sign up" ? "new-password" : "current-password"}
                placeholder="••••••••"
                required
                className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 transition"
              />
            </div>
          </>
        ) : null}

        {/* Bio (Sign up step 2) */}
        {currState === "Sign up" && isDataSubmitted ? (
          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-xs uppercase tracking-wider text-white/60">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              rows={4}
              placeholder="Provide a short bio..."
              required
              className="p-3 rounded-lg bg-white/5 text-white placeholder-white/40 border border-white/10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40 transition resize-none"
            />
          </div>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-95 active:opacity-90 transition"
        >
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        {/* Terms */}
        <div className="flex items-center gap-2 text-sm text-white/60">
          <input
            id="terms"
            name="terms"
            type="checkbox"
            autoComplete="on"
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <label htmlFor="terms" className="cursor-pointer">
            Agree to the terms of use &amp; privacy policy
          </label>
        </div>

        {/* Switch auth mode */}
        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-white/70">
              Already have an account?
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="ml-1 font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-white/70">
              Create an account
              <span
                onClick={() => setCurrState("Sign up")}
                className="ml-1 font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
