import React, { useState } from 'react';

type DemoUser = {
  role: string;
  email: string;
  password: string;
};

const DEMO_USERS: DemoUser[] = [
  { role: 'Recruiter',       email: 'recruiter@buxton.com',  password: 'password' },
  { role: 'Account Manager', email: 'manager@buxton.com',    password: 'password' },
  { role: 'Admin',           email: 'admin@buxton.com',      password: 'password' },
  { role: 'Hiring Manager',  email: 'hiring@buxton.com',     password: 'password' },
  { role: 'Auditor',         email: 'auditor@buxton.com',    password: 'password' },
];

function fakeLogin(email: string, password: string) {
  const match = DEMO_USERS.find(u => u.email === email && u.password === password);
  if (!match) return { ok: false, message: 'Invalid credentials' };
  return { ok: true, message: `Logged in as ${match.role}` };
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = fakeLogin(email.trim(), pwd);
    if (!res.ok) {
      setError(res.message);
      setStatus(null);
      return;
    }
    setStatus(res.message);
  };

  return (
    <div className="login-shell flex min-h-screen w-full">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 flex-col justify-between bg-[#0D1320] text-white px-12 py-10 relative overflow-hidden">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Gray Matter</h1>
          <p className="text-sm opacity-70 mt-1">by Buxton Consulting</p>
        </div>

        <div className="max-w-xl mb-24">
          <h2 className="text-3xl md:text-4xl font-bold leading-snug">
            Transform Recruitment into a Strategic Advantage.
          </h2>
            <p className="mt-4 text-sm md:text-base opacity-80">
              Our Talent Intelligence Platform uses advanced AI to find, evaluate, and secure the best
              talent, faster and with less bias.
            </p>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 w-[520px] h-[520px]">
          <div className="absolute inset-0 rounded-full bg-[#1E3A40] opacity-30" />
          <div className="absolute inset-10 rounded-full bg-[#1E3A40] opacity-25" />
            <div className="absolute inset-20 rounded-full bg-[#1E3A40] opacity-20" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full md:w-1/2 bg-[#F6F7F9] px-6 sm:px-10 lg:px-24 py-14">
        <div className="w-full max-w-md">
          <header>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome Back</h2>
            <p className="mt-1 text-sm text-gray-600">Sign in to continue to Gray Matter</p>
          </header>

          <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7F72] focus:border-[#2F7F72]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7F72] focus:border-[#2F7F72]"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm rounded bg-red-50 border border-red-200 px-3 py-2 text-red-700"
              >
                {error}
              </div>
            )}
            {status && (
              <div
                role="status"
                className="text-sm rounded bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-700"
              >
                {status}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded bg-[#2F7F72] hover:bg-[#27675D] focus:bg-[#27675D] text-white py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F7F72] transition-colors"
            >
              Sign In
            </button>
          </form>

          <section
            aria-label="Demo credentials"
            className="mt-8 rounded bg-white/60 border border-gray-200 p-4 text-sm leading-6 text-gray-700"
          >
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <ul className="space-y-1">
              {DEMO_USERS.map(u => (
                <li key={u.email} className="flex justify-between gap-2">
                  <span>
                    <span className="font-medium">{u.role}:</span>{' '}
                    <code className="text-gray-800">{u.email}</code>
                  </span>
                  <button
                    type="button"
                    className="text-xs text-[#2F7F72] hover:underline"
                    onClick={() => {
                      navigator.clipboard?.writeText(u.email).catch(() => {});
                      setStatus(`Copied ${u.email}`);
                      setTimeout(() => setStatus(null), 1500);
                    }}
                    aria-label={`Copy ${u.role} email`}
                  >
                    copy
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3">
              <span className="font-medium">Password (for all):</span>{' '}
              <code className="text-gray-800">password</code>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;