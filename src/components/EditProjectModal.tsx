'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Project {
  id: string
  title: string
  intro?: string
  phase: string
  areas: string[]
  value_dimensions: string[]
}

interface EditProjectModalProps {
  project: Project | null
  onClose: () => void
  onUpdate: (project: Project) => void
}

const PHASES = ['idea', 'pilot', 'implemented', 'cancelled'] as const
const AREAS = [
  'Administration',
  'Kultur och fritid',
  'Ledning och styrning',
  'Medborgarservice och kommunikation',
  'Miljö och hållbarhet',
  'Samhällsbyggnad och stadsbyggnad',
  'Socialtjänst och hälsa/vård och omsorg',
  'Säkerhet och krisberedskap',
  'Utbildning och skola',
  'Intern administration'
] as const

const VALUE_DIMENSIONS = [
  'Effektivisering',
  'Kostnadsbesparing',
  'Kvalitet / noggrannhet',
  'Medborgarnytta',
  'Innovation',
  'Tidsbesparing'
] as const

export default function EditProjectModal({ project, onClose, onUpdate }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    intro: '',
    phase: 'idea' as const,
    areas: [] as string[],
    value_dimensions: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        intro: project.intro || '',
        phase: project.phase as any || 'idea',
        areas: project.areas || [],
        value_dimensions: project.value_dimensions || []
      })
    }
  }, [project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to update project')
      }

      const updatedProject = await response.json()
      onUpdate(updatedProject)
      onClose()
    } catch (err) {
      setError('Failed to update project')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAreaChange = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }))
  }

  const handleValueDimensionChange = (dimension: string) => {
    setFormData(prev => ({
      ...prev,
      value_dimensions: prev.value_dimensions.includes(dimension)
        ? prev.value_dimensions.filter(d => d !== dimension)
        : [...prev.value_dimensions, dimension]
    }))
  }

  if (!project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-[#004D66]">Redigera projekt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titel
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FECB00]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beskrivning
            </label>
            <textarea
              value={formData.intro}
              onChange={(e) => setFormData(prev => ({ ...prev, intro: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FECB00]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fas
            </label>
            <select
              value={formData.phase}
              onChange={(e) => setFormData(prev => ({ ...prev, phase: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FECB00]"
            >
              {PHASES.map(phase => (
                <option key={phase} value={phase}>
                  {phase === 'idea' ? 'Idé' : 
                   phase === 'pilot' ? 'Pilot' :
                   phase === 'implemented' ? 'Implementerad' : 
                   'Avbruten'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Områden
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AREAS.map(area => (
                <label key={area} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.areas.includes(area)}
                    onChange={() => handleAreaChange(area)}
                    className="rounded border-gray-300 text-[#FECB00] focus:ring-[#FECB00]"
                  />
                  <span className="text-sm text-gray-700">{area}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Värdedimensioner
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VALUE_DIMENSIONS.map(dimension => (
                <label key={dimension} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.value_dimensions.includes(dimension)}
                    onChange={() => handleValueDimensionChange(dimension)}
                    className="rounded border-gray-300 text-[#FECB00] focus:ring-[#FECB00]"
                  />
                  <span className="text-sm text-gray-700">{dimension}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#004D66] text-white rounded-md hover:bg-[#003A52] disabled:opacity-50"
            >
              {loading ? 'Sparar...' : 'Spara'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 