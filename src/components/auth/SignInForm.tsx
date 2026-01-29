"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackParam = searchParams.get("callbackUrl");
  const callbackUrl = callbackParam && callbackParam.startsWith("/") ? callbackParam : "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push(res?.url ?? callbackUrl);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    await signIn("google", { callbackUrl });
    setSocialLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={socialLoading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.92h5.46c-.24 1.24-.99 2.3-2.1 3l3.38 2.62c1.98-1.83 3.12-4.52 3.12-7.72 0-.74-.06-1.45-.18-2.12H12z" />
                  <path fill="#34A853" d="M6.56 14.42l-.86.66-2.7 2.08C4.9 20.66 8.24 23 12 23c2.97 0 5.44-.98 7.26-2.66l-3.38-2.62c-.94.64-2.14 1.02-3.88 1.02-2.98 0-5.5-2.01-6.4-4.8z" />
                  <path fill="#4A90E2" d="M3 7.84C2.09 9.63 1.6 11.72 1.6 14c0 2.28.49 4.37 1.4 6.16l3.36-2.62c-.22-.66-.36-1.38-.36-2.16 0-.78.14-1.5.36-2.16z" />
                  <path fill="#FBBC05" d="M12 5.5c1.62 0 3.06.56 4.2 1.66l3.14-3.14C17.43 1.45 14.96 0.5 12 0.5 8.24 0.5 4.9 2.84 3 6.16l3.36 2.62C6.94 6.58 9.02 5.5 12 5.5z" />
                </svg>
              </span>
              {socialLoading ? "Contacting Google..." : "Continue with Google"}
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              or continue with email
              <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
          </div>
          
            <form onSubmit={handleSubmit}>
              {error && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                      {error}
                  </div>
              )}
              <div className="space-y-5">
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <Checkbox
                        className="w-5 h-5"
                        checked={isChecked}
                        onChange={setIsChecked}
                    />
                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                        Keep me logged in
                    </p>
                    </div>
                </div>
                
                <div>
                  <button disabled={loading || socialLoading} className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50">
                    {loading ? "Signing In..." : "Sign In"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account?
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}

