export default function CandidateProfileModal({ profile, onClose }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-2">Candidate Profile</h3>
        <p className="font-medium">{profile.name}</p>
        <p className="text-sm text-gray-600">{profile.title}</p>
        <p className="text-sm text-gray-600 mt-1">{profile.email}</p>

        <div className="mt-6 flex justify-end">
          <button
            className="px-4 py-2 text-sm rounded bg-gray-100 border hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}