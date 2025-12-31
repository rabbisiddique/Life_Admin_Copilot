"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { resendVerificationEmail } from "../../../../actions/user";
import { useAuth } from "../../../../hooks/useAuth";

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const { user } = useAuth();

  const resend = async () => {
    setIsResending(true);
    try {
      const r = await resendVerificationEmail(user?.email!);
      r.success ? toast.success(r.message) : toast.error(r.message);
    } catch (error) {
      toast.error("Failed to resend email");
    } finally {
      setIsResending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-lg border-primary/20 shadow-2xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-4 pb-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg">
                <Mail className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 shadow-lg animate-bounce">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to
            </CardDescription>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Mail className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Open your email inbox and look for our verification email
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <p className="text-sm text-purple-900 dark:text-purple-100">
                Click the verification link in the email to confirm your account
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <p className="text-sm text-green-900 dark:text-green-100">
                You'll be redirected back and ready to go!
              </p>
            </div>
          </div>

          {/* Resend Button */}
          <div className="space-y-3">
            <Button
              onClick={resend}
              disabled={isResending}
              variant="outline"
              className="w-full h-11 border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isResending ? "animate-spin" : ""}`}
              />
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="w-full h-11 text-muted-foreground hover:text-foreground"
            >
              Skip for now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              Can't find the email? Check your spam folder or try resending.
              <br />
              Need help?{" "}
              <button className="text-primary hover:underline font-medium">
                Contact support
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
