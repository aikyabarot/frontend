import { useAppData } from '../context/AppContext';

export default function ClientsListPage({ onNavigate, onOpenCandidate }) {
  const { getClients, getCandidateProfile } = useAppData();
  const clients = getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Clients</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded shadow p-4">
            <h3 className="font-medium">{client.name}</h3>
            <p className="text-sm text-gray-500">{client.description}</p>

            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Candidates</p>
              <div className="flex flex-wrap gap-2">
                {(client.candidateIds || []).map((cid) => {
                  const cand = getCandidateProfile(cid);
                  return (
                    <button
                      key={cid}
                      className="text-xs bg-gray-100 rounded px-2 py-1 border hover:bg-gray-200"
                      onClick={() => onOpenCandidate(cid)}
                    >
                      {cand?.name || cid}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              className="mt-4 px-3 py-1 text-sm bg-blue-600 text-white rounded"
              onClick={() => onNavigate('clientDetail', { clientId: client.id })}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}