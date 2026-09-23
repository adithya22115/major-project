import React, { useState, useEffect } from 'react';
import { getInventory, adjustInventoryQuantity } from '../../services/inventoryService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import { toast } from 'react-hot-toast';
import { Package, AlertTriangle, Plus, Minus } from 'lucide-react';

const InventoryManagement = () => {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [adjustingId, setAdjustingId] = useState(null);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getInventory();
        setInventory(data);
      } catch (err) {
        toast.error('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter(item => 
    item.medicineName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adjustQuantity = async (item, type) => {
    const value = window.prompt(`${type === 'ADD' ? 'Add' : 'Remove'} how many ${item.medicineName} units?`);
    if (value === null) return;
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error('Enter a positive whole number');
      return;
    }
    const reason = window.prompt('Reason for this stock adjustment (optional):') || '';
    try {
      setAdjustingId(item.id);
      const updated = await adjustInventoryQuantity(item.medicineId, quantity, type, reason);
      setInventory(prev => prev.map(row => row.id === item.id ? updated : row));
      toast.success(`Stock ${type === 'ADD' ? 'added' : 'removed'} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setAdjustingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Inventory Management</h1>
          <p className="text-muted mt-1">Track and manage verified medicines in stock.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        <div className="p-4 border-b border-theme bg-surface2/30">
          <div className="max-w-md">
            <SearchBar 
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder="Search inventory by medicine name..." 
            />
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="p-12">
            <EmptyState 
              title="Inventory is empty" 
              description={searchTerm ? "No medicines match your search." : "Verify pending donations to add them to inventory."}
              icon={Package}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface2/50 text-subtle font-medium border-b border-theme">
                <tr>
                  <th className="px-6 py-3">Medicine Name</th>
                  <th className="px-6 py-3">Available</th>
                  <th className="px-6 py-3">Reserved</th>
                  <th className="px-6 py-3">Distributed</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Adjust Stock</th>
                  <th className="px-6 py-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-surface2/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-primary">{item.medicineName}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${item.availableQuantity < 10 ? 'text-red-400' : 'text-primary'}`}>
                        {item.availableQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-amber-400">{item.reservedQuantity}</td>
                    <td className="px-6 py-4 text-blue-400">{item.distributedQuantity}</td>
                    <td className="px-6 py-4">
                      {item.availableQuantity === 0 ? (
                        <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-red-500/30">
                          Out of Stock
                        </span>
                      ) : item.availableQuantity < 10 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-amber-500/30">
                          <AlertTriangle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-500/30">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item, 'ADD')}
                          disabled={adjustingId === item.id}
                          className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
                          title="Add stock"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item, 'REMOVE')}
                          disabled={adjustingId === item.id}
                          className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-50"
                          title="Remove stock"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted">
                      {new Date(item.updatedAt).toLocaleDateString()}
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

export default InventoryManagement;
