import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SCALE Admin Dashboard Sign In Page",
  description: "Sign in to access the SCALE Admin Dashboard",
};

export default function SignIn() {
  return <SignInForm />;
}
