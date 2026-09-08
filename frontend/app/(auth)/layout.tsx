// Minimal auth layout — no nav bars, just the dark backdrop
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950">
      {children}
    </div>
  );
}
