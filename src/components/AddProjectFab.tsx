import { useRouter } from 'next/navigation';

export default function AddProjectFab() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/projects')}
      style={{ position: 'fixed', bottom: 24, right: 24, borderRadius: '50%', height: 56, width: 56, fontSize: 32, background: '#FECB00', color: '#004D66', border: 'none', boxShadow: '0 3px 10px rgba(0,0,0,0.2)', cursor: 'pointer', zIndex: 1000 }}
      aria-label="Lägg till projekt (detaljerad)"
    >
      +
    </button>
  );
} 