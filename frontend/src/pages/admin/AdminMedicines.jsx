import React, { useState, useEffect } from 'react';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../../services/medicineService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-hot-toast';
import { Pill, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

const inputClass =
  'block w-full px-3 py-2 bg-surface2 border border-theme rounded-lg text-primary placeholder-subtle text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

const labelClass = 'block text-sm font-medium text-muted mb-1';

const emptyForm = { medicineName: '', manufacturer: '', category: '', dosage: '', description: '', requiresPrescription: false };

const AdminMedicines = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const data = await getMedicines();
      setMedicines(data);
    } catch {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateMedicine(editingId, formData);
        toast.success('Medicine updated');
      } else {
        await createMedicine(formData);
        toast.success('Medicine created');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (med) => {
    setFormData({
      medicineName: med.medicineName || '',
      manufacturer: med.manufacturer || '',
      category: med.category || '',
      dosage: med.dosage || '',
      description: med.description || '',
      requiresPrescription: med.requiresPrescription || false,
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMedicine(id);
      setMedicines(medicines.filter(m => m.id !== id));
      toast.success('Medicine deleted');
    } catch {
      toast.error('Failed to delete medicine');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const filtered = medicines.filter(m =>
    m.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Medicine Directory</h2>
          <p className="text-muted mt-1">Add, edit, or remove medicines from the catalog.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-surface rounded-xl shadow-sm border border-theme p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-primary">{editingId ? 'Edit Medicine' : 'Add New Medicine'}</h3>
            <button onClick={handleCancel} className="text-subtle hover:text-primary"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Medicine Name *</label>
              <input name="medicineName" required className={inputClass} value={formData.medicineName} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Manufacturer</label>
              <input name="manufacturer" className={inputClass} value={formData.manufacturer} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <input name="category" className={inputClass} value={formData.category} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Dosage</label>
              <input name="dosage" className={inputClass} value={formData.dosage} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <input name="description" className={inputClass} value={formData.description} onChange={handleChange} />
            </div>
            <div className="flex items-center gap-2">
              <input
                name="requiresPrescription"
                type="checkbox"
                checked={formData.requiresPrescription}
                onChange={handleChange}
                className="h-4 w-4 accent-blue-500 rounded"
              />
              <label className="text-sm text-muted">Requires Prescription</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={handleCancel} className="px-4 py-2 border border-theme rounded-lg text-sm font-medium text-muted hover:bg-surface2 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-colors">
                {saving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Check className="h-4 w-4" />}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medicines Table */}
      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        <div className="px-0 py-4 border-b border-theme bg-surface2/30">
          <div className="max-w-md w-full">
            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search medicines..." />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12">
            <EmptyState title="No medicines found" description="Add a medicine to get started." icon={Pill} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Dosage</th>
                  <th className="px-6 py-3">Manufacturer</th>
                  <th className="px-6 py-3">Rx Required</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filtered.map(med => (
                  <tr key={med.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{med.medicineName}</td>
                    <td className="px-6 py-4 text-muted">{med.category || '-'}</td>
                    <td className="px-6 py-4 text-muted">{med.dosage || '-'}</td>
                    <td className="px-6 py-4 text-muted">{med.manufacturer || '-'}</td>
                    <td className="px-6 py-4">
                      {med.requiresPrescription ? (
                        <span className="text-amber-400 text-xs font-medium">Yes</span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4">
                        <button aria-label={`Edit ${med.medicineName}`} onClick={() => handleEdit(med)} className="p-2 text-subtle hover:text-blue-400 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button aria-label={`Delete ${med.medicineName}`} onClick={() => handleDelete(med.id, med.medicineName)} className="p-2 text-subtle hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMedicines;
