import { useAppData } from '../context/AppContext';

export default function DashboardPage({ onNavigate, onOpenCandidate }) {
  const { candidates } = useAppData();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="text-gray-600">Quick access to recent candidates</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {candidates.map((c) => (
          <div key={c.id} className="bg-white rounded shadow p-4">
            <h3 className="font-medium">{c.name}</h3>
            <p className="text-sm text-gray-500">{c.title}</p>
            <div className="mt-3 flex gap-2">
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                onClick={() => onOpenCandidate(c.id)}
              >
                View Profile
              </button>
              <button
                className="px-3 py-1 text-sm bg-gray-100 rounded border"
                onClick={() => onNavigate('clients')}
              >
                Go to Clients
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}