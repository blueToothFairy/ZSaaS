import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

function SignInContent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <SignIn 
        fallbackRedirectUrl="/home"
        signUpUrl="/sign-up"
      />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}