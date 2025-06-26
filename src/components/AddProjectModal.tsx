import React, { useState, useRef } from 'react';

interface Municipality {
  id: number;
  name: string;
}

interface AddProjectModalProps {
  municipalities: Municipality[];
}

const CATEGORIES = [
  'Administration och personal',
  'Kultur och fritid',
  'Ledning och styrning',
  'Medborgarservice och kommunikation',
  'Miljö och hållbarhet',
  'Samhällsbyggnad och stadsbyggnad',
  'Socialtjänst och hälsa/vård och omsorg',
  'Säkerhet och krisberedskap',
  'Utbildning och skola',
  'Övrigt/oklart',
];
const VALUE_CATEGORIES = [
  'Effektivisering',
  'Kvalitet',
  'Innovation',
  'Medborgarnytta',
  'Annat',
];

export default function AddProjectModal({ municipalities }: AddProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{
    municipality_ids: number[];
    title: string;
    description: string;
    category: string;
    value_category: string;
    link: string;
  }>({
    municipality_ids: [0],
    title: '',
    description: '',
    category: '',
    value_category: '',
    link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const dialogRef = useRef(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMunicipalityChange = (idx: number, value: string) => {
    const newIds = [...form.municipality_ids];
    newIds[idx] = Number(value);
    setForm({ ...form, municipality_ids: newIds });
  };

  const handleAddMunicipality = () => {
    setForm({ ...form, municipality_ids: [...form.municipality_ids, 0] });
  };

  const handleRemoveMunicipality = (idx: number) => {
    const newIds = form.municipality_ids.filter((_, i) => i !== idx);
    setForm({ ...form, municipality_ids: newIds });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.title || !form.municipality_ids.filter(id => !!id).length || !form.category || !form.value_category) {
      setError('Fyll i alla obligatoriska fält');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        municipality_ids: form.municipality_ids.filter(id => !!id),
        title: form.title,
        description: form.description,
        category: form.category,
        value_category: form.value_category,
        link: form.link,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const { error } = await res.json();
      setError(error || 'Något gick fel');
      return;
    }
    setSuccess('Projektet sparades!');
    setForm({ municipality_ids: [0], title: '', description: '', category: '', value_category: '', link: '' });
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, borderRadius: '50%', height: 48, width: 48, fontSize: 28, background: '#FECB00', color: '#004D66', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 1000 }}
        aria-label="Lägg till projekt"
      >
        +
      </button>
      {open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form
            onSubmit={handleSubmit}
            style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 320, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: '#004D66' }}>Lägg till projekt</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 600, color: '#004D66', display: 'block', marginBottom: 6 }}>Kommun(er) <span style={{ color: 'red' }}>*</span></label>
              {form.municipality_ids.map((id, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <select
                    value={id || ''}
                    onChange={e => handleMunicipalityChange(idx, e.target.value)}
                    style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc', marginRight: 8, color:'#121F2B'}}
                    required
                  >
                    <option value="">Välj kommun</option>
                    {municipalities.filter(m =>
                      !form.municipality_ids.includes(m.id) || m.id === id
                    ).map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {form.municipality_ids.length > 1 && (
                    <button type="button" onClick={() => handleRemoveMunicipality(idx)} style={{ background: 'none', border: 'none', color: '#d00', fontSize: 20, cursor: 'pointer' }} title="Ta bort kommun">×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAddMunicipality} style={{ background: '#FECB00', color:'#121F2B', border: 'none', borderRadius: 4, padding: '4px 12px', fontWeight: 600, fontSize: 14, marginTop: 4, cursor: 'pointer' }}>
                + Lägg till kommun
              </button>
              <div style={{ fontSize: 12, color:'#121F2B', marginTop: 4 }}>
                Lägg till en eller flera kommuner som samarbetar i projektet.
              </div>
            </div>
            {/* ...rest of form... */}
            <div style={{ marginBottom: 12 }}>
              <input
                placeholder="Titel"
                name="title"
                value={form.title}
                onChange={handleChange}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', color:'#121F2B' }}
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <textarea
                placeholder="Beskrivning"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', color:'#121F2B' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', color:'#121F2B' }}
                required
              >
                <option value="">Välj kategori</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <select
                name="value_category"
                value={form.value_category}
                onChange={handleChange}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', color:'#121F2B' }}
                required
              >
                <option value="">Välj värdeskapande dimension</option>
                {VALUE_CATEGORIES.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12, color:'#121F2B' }}>
              <input
                placeholder="Länk (https://...)"
                name="link"
                value={form.link}
                onChange={handleChange}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', color:'#121F2B' }}
              />
            </div>
            {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
            {success && <p style={{ color: 'green', fontSize: 14 }}>{success}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: 10, borderRadius: 4, background: '#004D66', color: 'white', fontWeight: 600, fontSize: 16, border: 'none', marginTop: 8, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sparar...' : 'Spara projekt'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}