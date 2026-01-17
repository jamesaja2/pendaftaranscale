"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/actions/register";

export default function SignUpForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await registerAction(formData);

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push("/signin");
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full p-6 items-center justify-center">
      <div className="w-full max-w-md mx-auto mb-5">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeftIcon /> Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sign Up</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Create your account for Bazaar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="******" />
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
            
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-500">Already have an account? </span>
              <Link href="/signin" className="text-sm text-brand-500 hover:underline">
                Sign In
              </Link>
            </div>
        </form>
      </div>
    </div>
  );
}
