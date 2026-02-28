import { useState, useMemo } from 'react'
import { useMindstore } from '../contexts/MindstoreContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { cn } from '../lib/utils'
import {
  Search,
  Plus,
  Star,
  Folder,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Trash2,
  Edit3,
} from 'lucide-react'
import type { MindstoreItem } from '../types'
import toast from 'react-hot-toast'

export function MindstorePage() {
  const {
    items,
    categories,
    loading,
    createItem,
    updateItem,
    deleteItem,
    toggleFavorite,
    getFavoriteItems,
    getPrompts,
    searchItems,
  } = useMindstore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'prompts'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MindstoreItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    isPrompt: false,
  })

  const filteredItems = useMemo(() => {
    let result = items

    if (viewMode === 'favorites') {
      result = getFavoriteItems()
    } else if (viewMode === 'prompts') {
      result = getPrompts()
    }

    if (selectedCategory) {
      result = result.filter((i) => i.category === selectedCategory)
    }

    if (searchQuery) {
      result = searchItems(searchQuery)
    }

    return result
  }, [items, viewMode, selectedCategory, searchQuery, getFavoriteItems, getPrompts, searchItems])

  const handleOpenModal = (item?: MindstoreItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        content: item.content,
        category: item.category ?? 'general',
        tags: item.tags.join(', '),
        isPrompt: item.is_prompt,
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: '',
        isPrompt: false,
      })
    }
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required')
      return
    }

    try {
      const data = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category || null,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        is_prompt: formData.isPrompt,
        is_favorite: editingItem?.is_favorite ?? false,
      }

      if (editingItem) {
        await updateItem(editingItem.id, data)
        toast.success('Item updated')
      } else {
        await createItem(data)
        toast.success('Item created')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    }
  }

  const handleCopy = async (item: MindstoreItem) => {
    await navigator.clipboard.writeText(item.content)
    setCopiedId(item.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success('Copied to clipboard')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      await deleteItem(id)
      toast.success('Item deleted')
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-onyx-400" />
            Mindstore
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Save prompts, snippets, and ideas
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus size={16} />
          Add Item
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-800 bg-gray-950">
        <div className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-onyx-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === 'all'
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('favorites')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              viewMode === 'favorites'
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            <Star size={14} />
            Favorites
          </button>
          <button
            onClick={() => setViewMode('prompts')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
              viewMode === 'prompts'
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            <MessageSquare size={14} />
            Prompts
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-56 border-r border-gray-800 p-4 space-y-1 overflow-y-auto">
          <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Folder size={14} />
            Categories
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between',
              selectedCategory === null
                ? 'bg-onyx-900 text-onyx-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
            )}
          >
            All Categories
            <span className="text-xs text-gray-600">{items.length}</span>
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.category === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                  selectedCategory === cat.id
                    ? 'bg-onyx-900 text-onyx-300'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900',
                )}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
                <span className="ml-auto text-xs text-gray-600">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-onyx-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare size={28} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-1">No items found</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                {searchQuery
                  ? 'No items match your search. Try different keywords.'
                  : 'Start building your mindstore by adding prompts, code snippets, or ideas.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => handleOpenModal()} variant="outline" className="mt-4">
                  <Plus size={16} />
                  Add your first item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {item.is_prompt ? (
                        <MessageSquare size={16} className="text-onyx-400" />
                      ) : (
                        <FileText size={16} className="text-gray-500" />
                      )}
                      <h3 className="font-medium text-gray-200 text-sm line-clamp-1">{item.title}</h3>
                    </div>
                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={cn(
                        'transition-colors',
                        item.is_favorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400',
                      )}
                    >
                      <Star size={14} fill={item.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 line-clamp-3 mb-3 whitespace-pre-wrap">
                    {item.content}
                  </p>

                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-600">
                      {categories.find((c) => c.id === item.category)?.name ?? 'General'}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Copy"
                      >
                        {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Item' : 'Add to Mindstore'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
            placeholder="e.g. React Hooks Pattern"
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-onyx-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPrompt}
                  onChange={(e) => setFormData((d) => ({ ...d, isPrompt: e.target.checked }))}
                  className="rounded border-gray-600 text-onyx-500 focus:ring-onyx-500"
                />
                <span className="text-sm text-gray-300">Is Prompt</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((d) => ({ ...d, content: e.target.value }))}
              placeholder="Enter your content, code, or prompt..."
              rows={8}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-onyx-500 font-mono"
            />
          </div>

          <Input
            label="Tags"
            value={formData.tags}
            onChange={(e) => setFormData((d) => ({ ...d, tags: e.target.value }))}
            placeholder="react, hooks, javascript (comma separated)"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
