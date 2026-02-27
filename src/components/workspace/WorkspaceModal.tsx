import React, { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { Slider } from '../ui/Slider'
import type { Workspace } from '../../types'
import { MODELS, PROVIDER_LABELS } from '../../lib/models'
import toast from 'react-hot-toast'

interface WorkspaceModalProps {
  open: boolean
  onClose: () => void
  workspace?: Workspace | null
  onSave: (data: Omit<Workspace, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
}

const DEFAULTS = {
  name: '',
  description: '',
  model_id: 'gpt-4o-mini',
  system_prompt: 'You are a helpful AI assistant.',
  temperature: 0.7,
  max_tokens: 2048,
}

export function WorkspaceModal({ open, onClose, workspace, onSave }: WorkspaceModalProps) {
  const [form, setForm] = useState(DEFAULTS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (workspace) {
      setForm({
        name: workspace.name,
        description: workspace.description ?? '',
        model_id: workspace.model_id,
        system_prompt: workspace.system_prompt ?? '',
        temperature: workspace.temperature,
        max_tokens: workspace.max_tokens,
      })
    } else {
      setForm(DEFAULTS)
    }
  }, [workspace, open])

  const grouped = MODELS.reduce<Record<string, typeof MODELS>>((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await onSave({
        name: form.name.trim(),
        description: form.description.trim() || null,
        model_id: form.model_id,
        system_prompt: form.system_prompt.trim() || null,
        temperature: form.temperature,
        max_tokens: form.max_tokens,
      })
      toast.success(workspace ? 'Workspace updated' : 'Workspace created')
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={workspace ? 'Edit Workspace' : 'New Workspace'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Code Assistant"
          required
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional description"
        />

        <Select
          label="Default Model"
          value={form.model_id}
          onChange={(e) => setForm((f) => ({ ...f, model_id: e.target.value }))}
        >
          {Object.entries(grouped).map(([provider, models]) => (
            <optgroup key={provider} label={PROVIDER_LABELS[provider] ?? provider}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>

        <Textarea
          label="System Prompt"
          value={form.system_prompt}
          onChange={(e) => setForm((f) => ({ ...f, system_prompt: e.target.value }))}
          placeholder="You are a helpful assistant..."
          rows={4}
          hint="Instructions given to the AI at the start of every conversation"
        />

        <Slider
          label="Temperature"
          value={form.temperature}
          onChange={(v) => setForm((f) => ({ ...f, temperature: v }))}
          min={0}
          max={2}
          step={0.1}
          hint="Higher = more creative, Lower = more deterministic"
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Max Tokens</label>
            <span className="text-sm text-onyx-400 font-mono">{form.max_tokens}</span>
          </div>
          <input
            type="range"
            min={256}
            max={8192}
            step={256}
            value={form.max_tokens}
            onChange={(e) => setForm((f) => ({ ...f, max_tokens: parseInt(e.target.value) }))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-onyx-500"
          />
          <p className="text-xs text-gray-500">Maximum response length</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!form.name.trim()} className="flex-1">
            {workspace ? 'Save Changes' : 'Create Workspace'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
