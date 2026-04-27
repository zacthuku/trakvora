import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl text-white tracking-tight">
            trakvora
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            East Africa Freight Exchange
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
