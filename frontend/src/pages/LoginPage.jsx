import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button } from "@heroui/react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../app/AuthContext";

const inputWrapperClass =
  "flex h-12 w-full items-center rounded-xl border border-slate-300 bg-white px-3 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100";

const inputClass =
  "h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login({
        email,
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-linear-to-br from-sky-700 via-sky-600 to-cyan-400 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 left-20 h-80 w-80 rounded-full bg-white/10" />

          <div className="relative">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
                <img
                  src="/slms-logo.png"
                  alt="SLMS Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold">School-Based Leave Management</h2>
                {/* <p className="text-sm text-sky-100">
                  School-Based Leave Management
                </p> */}
              </div>
            </div>

            <div className="mt-24 max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-sky-100">
                Simple. Secure. Organized.
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Manage leave applications and credits with ease.
              </h1>

              <p className="mt-6 text-lg leading-8 text-sky-50">
                A clean leave management portal for Administrative Officers,
                Principals, Division Admins, and Teachers.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3">
                <FeatureItem text="File and monitor leave applications" />
                <FeatureItem text="Track leave credits and ledger balances" />
                <FeatureItem text="Approve requests based on assigned role" />
              </div>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/20 bg-white/15 p-5 shadow-sm backdrop-blur">
            <div className="flex gap-3">
              <ShieldCheckIcon className="h-6 w-6 shrink-0 text-sky-100" />
              <p className="text-sm font-medium leading-6 text-sky-50">
                Built for school-based leave tracking, approval monitoring, and
                leave credits visibility.
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10">
          <Card className="w-full max-w-md border border-slate-200 bg-white shadow-xl">
            <Card.Content className="p-8">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm">
                  <img
                    src="/slms-logo.png"
                    alt="SLMS Logo"
                    className="h-full w-full object-contain"
                  />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to access your leave management dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>

                  <div className={inputWrapperClass}>
                    <EnvelopeIcon className="mr-3 h-5 w-5 text-slate-400" />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <div className={inputWrapperClass}>
                    <LockClosedIcon className="mr-3 h-5 w-5 text-slate-400" />

                    <input
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Enter your password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setIsPasswordVisible((current) => !current)
                      }
                      className="ml-3 rounded-md p-1 text-slate-400 transition hover:text-slate-700"
                      aria-label={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      {isPasswordVisible ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  color="primary"
                  size="lg"
                  isLoading={loading}
                  className="h-12 w-full bg-sky-600 font-semibold text-white"
                >
                  Sign in
                  <ArrowRightIcon className="h-5 w-5" />
                </Button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex gap-3">
                    <ClipboardDocumentCheckIcon className="h-5 w-5 shrink-0 text-sky-700" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Need an admin account?
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Register a School Admin Officer or Division Admin
                        account to begin system setup.
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                  >
                    Register Admin Account
                  </Link>
                </div>
              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                For account concerns, please contact your Administrative
                Officer.
              </p>
            </Card.Content>
          </Card>
        </section>
      </div>
    </main>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
      <CheckCircleIcon className="h-5 w-5 shrink-0 text-sky-100" />
      <p className="text-sm font-medium text-sky-50">{text}</p>
    </div>
  );
}