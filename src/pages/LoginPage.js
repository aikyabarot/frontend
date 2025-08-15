import { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (email) onLogin(email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded w-full p-2 mb-4"
          placeholder="Email"
          required
        />
        <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded">
          Login
        </button>
      </form>
    </div>
  );
}