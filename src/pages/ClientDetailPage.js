import { useMemo } from 'react';
import { useAppData } from '../context/AppContext';

export default function ClientDetailPage({ onNavigate, onOpenCandidate, context }) {
  const { getClient, getCandidateProfile } = useAppData();

  const client = useMemo(() => {
    if (!context || !context.clientId) return null;
    return getClient(context.clientId);
  }, [context, getClient]);

  if (!client) {
    return (
      <div>
        <p className="text-gray-600">No client selected.</p>
        <button
          className="mt-3 px-3 py-1 text-sm bg-gray-100 rounded border"
          onClick={() => onNavigate('clients')}
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{client.name}</h2>
        <button
          className="px-3 py-1 text-sm bg-gray-100 rounded border"
          onClick={() => onNavigate('clients')}
        >
          Back
        </button>
      </div>

      <p className="text-gray-600">{client.description}</p>

      <div>
        <h3 className="font-medium mb-2">Candidates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(client.candidateIds || []).map((cid) => {
            const cand = getCandidateProfile(cid);
            return (
              <div key={cid} className="bg-white rounded shadow p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{cand?.name || cid}</div>
                  <div className="text-sm text-gray-500">{cand?.title}</div>
                </div>
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                  onClick={() => onOpenCandidate(cid)}
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}