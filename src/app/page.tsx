"use client";
import HomeShowcase from "@/components/home/HomeShowcase";

export default function HomePage() {
  // const [status, setStatus] = useState<"success" | "expired" | null>(null);
  // const router = useRouter();

  // useEffect(() => {
  //   const hash = window.location.hash.replace("#", "");
  //   const params = new URLSearchParams(hash);

  //   const errorCode = params.get("error_code");
  //   if (errorCode === "otp_expired") {
  //     setStatus("expired");
  //     toast.error("Your confirmation link has expired.");
  //     // router.push("/auth/verify-email");
  //   } else {
  //     setStatus("success");
  //     setTimeout(() => router.push("/"), 2000);
  //   }
  // }, [router]);

  // if (status === "expired") {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center p-4">
  //       <p className="text-center text-red-600 mb-4">
  //         This confirmation link has expired.
  //       </p>
  //       <button
  //         onClick={() => router.push("/auth/verify-email")}
  //         className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  //       >
  //         Resend Verification Email
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <>
      <HomeShowcase />
    </>
  );
}
