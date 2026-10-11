import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="shell w-full max-w-md">
        <div className="core flex flex-col gap-8 p-8 sm:p-10">
          <div className="flex items-center gap-4">
            <Image
              src="/images/brand/logo-256.webp"
              alt="EBAUB CSE department seal"
              width={56}
              height={56}
              priority
              className="size-14 rounded-full bg-white"
            />
            <div>
              <p className="eyebrow mb-1.5 w-max">Admin</p>
              <h1 className="font-display text-display-sm text-ink">Department of CSE</h1>
            </div>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
