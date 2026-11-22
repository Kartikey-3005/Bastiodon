import Link from "next/link";
import { Shield } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mb-4 shadow-md">
        <Shield className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-primary mb-2">Page Not Found (404)</h2>
      <p className="text-charcoal-muted max-w-md mb-6 text-[15px]">
        The safety portal page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-secondary hover:bg-secondary-hover text-white rounded-lg font-semibold text-sm transition-all shadow-sm"
      >
        Return to Parent Dashboard
      </Link>
    </div>
  );
}

