import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeMedicineImage, createDonation } from '../../services/donationService';
import FileUpload from '../../components/common/FileUpload';
import { toast } from 'react-hot-toast';
import { Save, X } from 'lucide-react';

const DonateMedicine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState({
    medicineName: '',
    manufacturer: '',
    category: 'TABLET',
    dosage: '',
    description: '',
    requiresPrescription: false,
    quantity: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    condition: 'SEALED',
    remarks: ''
  });
  
  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate expiry date is in future
    if (new Date(formData.expiryDate) <= new Date()) {
      toast.error('Expiry date must be in the future');
      return;
    }
    
    setLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key]);
      });
      
      // Append images
      images.forEach(img => {
        data.append('images', img);
      });
      
      await createDonation(data);
      toast.success('Donation submitted successfully!');
      navigate('/donor/donations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit donation');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!images[0]) {
      toast.error('Upload a medicine photo first');
      return;
    }
    setAnalyzing(true);
    try {
      const result = await analyzeMedicineImage(images[0], formData.medicineName, formData.dosage);
      const extracted = result.extractedFields || result;
      setFormData(prev => ({
        ...prev,
        medicineName: extracted.medicineName || prev.medicineName,
        dosage: extracted.dosage || prev.dosage,
        quantity: extracted.quantity != null ? String(extracted.quantity) : prev.quantity,
        expiryDate: extracted.expiryDate ? extracted.expiryDate.slice(0, 7) : prev.expiryDate,
      }));
      if (result.warning || result.mismatchWarning) {
        toast.error(result.warning || result.mismatchWarning);
      } else {
        toast.success(`Image analyzed (${Math.round((result.confidence || 0) * 100)}% confidence). Review the fields before submitting.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyze the image. You can enter the details manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const inputClass = "w-full rounded-lg bg-surface2 border border-theme text-primary placeholder-subtle p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const labelClass = "block text-sm font-medium text-muted mb-1.5";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Donate Medicine</h1>
        <p className="text-muted mt-1">Please provide accurate details about the medicine you are donating.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Medicine Information Section */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-primary mb-5 pb-3 border-b border-theme">Medicine Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Medicine Name *</label>
              <input type="text" name="medicineName" required value={formData.medicineName} onChange={handleChange} className={inputClass} placeholder="e.g. Paracetamol 500mg" />
            </div>
            
            <div>
              <label className={labelClass}>Manufacturer</label>
              <input type="text" name="manufacturer" value={formData.manufacturer} onChange={handleChange} className={inputClass} placeholder="e.g. GSK" />
            </div>
            
            <div>
              <label className={labelClass}>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                <option value="TABLET">Tablet</option>
                <option value="CAPSULE">Capsule</option>
                <option value="SYRUP">Syrup</option>
                <option value="INJECTION">Injection</option>
                <option value="CREAM">Cream/Ointment</option>
                <option value="DROPS">Drops</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div>
              <label className={labelClass}>Dosage</label>
              <input type="text" name="dosage" value={formData.dosage} onChange={handleChange} className={inputClass} placeholder="e.g. 500mg, 10ml" />
            </div>
            
            <div className="flex items-center mt-6">
              <input type="checkbox" id="requiresPrescription" name="requiresPrescription" checked={formData.requiresPrescription} onChange={handleChange} className="h-4 w-4 bg-surface2 border-theme rounded text-blue-600 focus:ring-blue-500" />
              <label htmlFor="requiresPrescription" className="ml-2 block text-sm text-primary">
                This medicine requires a doctor's prescription
              </label>
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Description (Optional)</label>
              <textarea name="description" rows="2" value={formData.description} onChange={handleChange} className={inputClass} placeholder="Any specific details about the medicine..."></textarea>
            </div>
          </div>
        </div>

        {/* Donation Details Section */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-primary mb-5 pb-3 border-b border-theme">Donation Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Quantity (Units/Strips) *</label>
              <input type="number" name="quantity" min="1" required value={formData.quantity} onChange={handleChange} className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Batch Number *</label>
              <input type="text" name="batchNumber" required value={formData.batchNumber} onChange={handleChange} className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Manufacture Date (Optional)</label>
              <input type="month" name="manufactureDate" value={formData.manufactureDate} onChange={handleChange} className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Expiry Date *</label>
              <input type="month" name="expiryDate" required value={formData.expiryDate} onChange={handleChange} className={inputClass} />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className={labelClass}>Condition *</label>
              <div className="flex gap-4">
                {['SEALED', 'NEW', 'USED'].map((cond) => (
                  <label key={cond} className="inline-flex items-center cursor-pointer">
                    <input type="radio" name="condition" value={cond} checked={formData.condition === cond} onChange={handleChange} className="form-radio h-4 w-4 bg-surface2 border-theme text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-primary capitalize">{cond.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-surface rounded-xl shadow-sm border border-theme p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-primary mb-5 pb-3 border-b border-theme">Upload Images</h2>
          <div className="mb-6">
            <label className={labelClass}>Medicine Photos (Optional, helps verification)</label>
            <p className="text-xs text-subtle mb-3">Upload clear photos showing the medicine name, batch number, and expiry date.</p>
            <FileUpload 
              onFileSelect={(files) => setImages(files)}
              accept="image/*"
              multiple={true}
              maxSize={5}
            />
            <button
              type="button"
              onClick={handleAnalyzeImage}
              disabled={analyzing || images.length === 0}
              className="mt-3 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? 'Analyzing...' : 'Analyze image and auto-fill'}
            </button>
            <p className="text-xs text-subtle mt-2">AI suggestions are not a substitute for checking the package yourself. You can edit every field.</p>
          </div>
          
          <div>
            <label className={labelClass}>Additional Remarks</label>
            <textarea name="remarks" rows="3" value={formData.remarks} onChange={handleChange} className={inputClass} placeholder="Any other notes for the pharmacy reviewing this donation..."></textarea>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-4 pb-12">
          <button type="button" onClick={() => navigate('/donor/dashboard')} className="px-5 py-2.5 border border-theme rounded-lg text-primary font-medium hover:bg-surface2 transition-colors flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-600/20">
            {loading ? <span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent text-white rounded-full"></span> : <Save className="h-4 w-4" />}
            Submit Donation
          </button>
        </div>
        
      </form>
    </div>
  );
};

export default DonateMedicine;
