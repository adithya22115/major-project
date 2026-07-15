import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMedicineById } from '../../services/medicineService';
import { createRequest } from '../../services/requestService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FileUpload from '../../components/common/FileUpload';
import { toast } from 'react-hot-toast';
import { Package, ArrowLeft, ShieldAlert } from 'lucide-react';

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [prescription, setPrescription] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const data = await getMedicineById(id);
        setMedicine(data);
      } catch (err) {
        toast.error('Failed to load medicine details');
        navigate('/recipient/medicines');
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id, navigate]);

  const handleRequest = async (e) => {
    e.preventDefault();
    
    if (medicine.requiresPrescription && !prescription) {
      toast.error('A prescription is required for this medicine');
      return;
    }

    if (quantity < 1) {
      toast.error('Quantity must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('medicineId', medicine.id);
      formData.append('requestedQuantity', quantity);
      
      if (prescription) {
        formData.append('prescription', prescription);
      }

      await createRequest(formData);
      toast.success('Medicine requested successfully');
      navigate('/recipient/requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!medicine) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-blue-500 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Pool
      </button>

      <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
        <div className="md:flex">
          {/* Details Section */}
          <div className="p-8 md:w-2/3 border-b md:border-b-0 md:border-r border-theme">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-blue-500/15 text-blue-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-blue-500/30">
                {medicine.category}
              </span>
              {medicine.requiresPrescription && (
                <span className="bg-amber-500/15 text-amber-400 text-xs px-2.5 py-1 rounded-full font-medium border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" /> Rx Required
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-primary mb-2">{medicine.medicineName}</h1>
            <p className="text-lg text-muted mb-6">{medicine.dosage} • {medicine.manufacturer}</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Description</h3>
                <p className="text-muted leading-relaxed">
                  {medicine.description || 'No description provided by the donor.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Request Form Section */}
          <div className="p-8 md:w-1/3 bg-surface2/30 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-primary mb-4">Request this Medicine</h3>
            
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-muted mb-1">
                  Quantity Needed
                </label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-lg border-theme shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-surface2 text-primary p-2.5 border" 
                  required
                />
              </div>

              {medicine.requiresPrescription && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Upload Prescription *
                  </label>
                  <FileUpload 
                    onFileSelect={(file) => setPrescription(file)}
                    accept="image/*,.pdf"
                    maxSize={2}
                  />
                </div>
              )}
              
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors mt-4"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;
