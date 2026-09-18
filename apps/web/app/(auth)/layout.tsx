export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mavora-navy via-mavora-charcoal to-slate-900 p-6">
      {children}
    </div>
  );
}