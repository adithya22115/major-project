import React, { useState, useEffect } from 'react';
import { getDonations } from '../../services/donationService';
import { verifyDonation } from '../../services/verificationService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Check, X, AlertTriangle } from 'lucide-react';
import { createDonationQr } from '../../services/donationQrService';
import { uploadFile } from '../../services/fileService';
import { QRCodeSVG } from 'qrcode.react';

const PendingDonations = () => {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [packagingPhotoUrl, setPackagingPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const getQrFilename = (donation, generatedQr = qrData) => {
    if (generatedQr?.qrCodeFileName) return generatedQr.qrCodeFileName;
    const medicineName = (donation?.medicineName || 'medicine')
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'medicine';
    const receivedDate = donation?.createdAt
      ? new Date(donation.createdAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    return `${medicineName}-${receivedDate}.svg`;
  };

  const downloadQr = (svg, donation) => {
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getQrFilename(donation);
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!qrData || !selectedDonation) return;

    const frame = window.requestAnimationFrame(() => {
      const svg = document.querySelector('[data-donation-qr="true"]');
      if (svg) {
        downloadQr(svg, selectedDonation);
        toast.success(`QR saved as ${getQrFilename(selectedDonation)}`);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [qrData, selectedDonation]);

  const handleDownloadQr = () => {
    const svg = document.querySelector('[data-donation-qr="true"]');
    if (!svg || !selectedDonation) {
      toast.error('QR code is not ready to download');
      return;
    }
    downloadQr(svg, selectedDonation);
  };

  useEffect(() => {
    fetchPendingDonations();
  }, []);

  const fetchPendingDonations = async () => {
    try {
      setLoading(true);
      const data = await getDonations();
      setDonations(data.filter(d => d.status === 'PENDING' || d.status === 'UNDER_REVIEW'));
    } catch (err) {
      toast.error('Failed to load pending donations');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedDonation) return;
    
    if (status === 'REJECTED' && !remarks.trim()) {
      toast.error('Remarks are required when rejecting a donation');
      return;
    }

    try {
      setActionLoading(true);
      await verifyDonation(selectedDonation.id, {
        result: status,
        remarks
      });
      
      toast.success(`Donation ${status.toLowerCase()} successfully`);
      if (status === 'APPROVED') {
        setSelectedDonation(prev => ({ ...prev, status: 'APPROVED' }));
      } else {
        setSelectedDonation(null);
      }
      setRemarks('');
      fetchPendingDonations(); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify donation');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePackagingPhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await uploadFile(form, 'donation-packaging');
      setPackagingPhotoUrl(result.url || result);
      toast.success('Packaging photo uploaded');
    } catch {
      toast.error('Failed to upload packaging photo');
    } finally {
      setUploadingPhoto(false);
      event.target.value = '';
    }
  };

  const handleCreateQr = async () => {
    if (!selectedDonation) return;
    if (!packagingPhotoUrl) {
      toast.error('Upload a packaging photo before creating the QR code');
      return;
    }
    try {
      setActionLoading(true);
      const result = await createDonationQr(selectedDonation.id, {
        medicineName: selectedDonation.medicineName,
        batchNumber: selectedDonation.batchNumber,
        expiryDate: selectedDonation.expiryDate,
        quantity: selectedDonation.quantity,
        packagingPhotoUrl,
        donorId: selectedDonation.donorId,
        verificationStatus: 'APPROVED',
      });
      setQrData(result);
      toast.success('Donation QR code created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create donation QR');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Pending Verifications</h1>
        <p className="text-muted mt-1">Review and verify donated medicines before they enter the inventory.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* List of Pending Donations */}
        <div className="lg:col-span-1 bg-surface rounded-xl shadow-sm border border-theme overflow-hidden h-[calc(100vh-200px)] flex flex-col">
          <div className="px-4 py-3 border-b border-theme bg-surface2/30">
            <h2 className="font-semibold text-primary">Queue ({donations.length})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {donations.length === 0 ? (
              <div className="p-8">
                <EmptyState 
                  title="Queue is empty" 
                  description="No pending donations to verify."
                  icon={ShieldCheck}
                />
              </div>
            ) : (
              <ul className="divide-y divide-theme">
                {donations.map(donation => (
                  <li key={donation.id}>
                    <button 
                      onClick={() => setSelectedDonation(donation)}
                      className={`w-full text-left px-4 py-4 hover:bg-surface2/40 transition-colors ${
                        selectedDonation?.id === donation.id ? 'bg-surface2/60 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-primary line-clamp-1">{donation.medicineName}</span>
                        <StatusBadge status={donation.status} />
                      </div>
                      <div className="text-xs text-muted flex justify-between mt-2">
                        <span>Batch: {donation.batchNumber}</span>
                        <span>{new Date(donation.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Verification Detail Panel */}
        <div className="lg:col-span-2">
          {selectedDonation ? (
            <div className="bg-surface rounded-xl shadow-sm border border-theme overflow-hidden">
              <div className="px-6 py-5 border-b border-theme bg-surface2/30">
                <h2 className="text-lg font-semibold text-primary">Verification Details</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-subtle mb-1">Medicine Name</p>
                    <p className="font-medium text-primary">{selectedDonation.medicineName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-subtle mb-1">Quantity</p>
                    <p className="font-medium text-primary">{selectedDonation.quantity} units</p>
                  </div>
                  <div>
                    <p className="text-sm text-subtle mb-1">Batch Number</p>
                    <p className="font-medium text-primary">{selectedDonation.batchNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-subtle mb-1">Expiry Date</p>
                    <p className={`font-medium ${new Date(selectedDonation.expiryDate) < new Date() ? 'text-red-400' : 'text-primary'}`}>
                      {selectedDonation.expiryDate}
                      {new Date(selectedDonation.expiryDate) < new Date() && ' (Expired)'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-subtle mb-1">Condition</p>
                    <p className="font-medium text-primary capitalize">{selectedDonation.condition?.toLowerCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-subtle mb-1">Donor Remarks</p>
                    <p className="font-medium text-primary">{selectedDonation.remarks || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-theme pt-6">
                  <h3 className="text-sm font-semibold text-primary mb-3">Verification Action</h3>
                  
                  {new Date(selectedDonation.expiryDate) < new Date() && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Warning: Medicine is expired</p>
                        <p className="text-sm text-red-300/80 mt-1">This donation should be rejected and safely discarded.</p>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted mb-1">Pharmacist Remarks (Required for Rejection)</label>
                    <textarea 
                      rows="3" 
                      className="w-full rounded-lg bg-surface2 border border-theme shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-primary placeholder-subtle"
                      placeholder="Notes regarding condition, quality, or reason for rejection..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    ></textarea>
                  </div>

                  {selectedDonation.status === 'APPROVED' && (
                    <div className="border-t border-theme pt-5 space-y-4">
                      <h3 className="text-sm font-semibold text-primary">Donation QR Code</h3>
                      <p className="text-xs text-muted">Create the QR only after the medicine has passed verification. The QR contains a server-validated donation token.</p>
                      <label className="block text-sm text-muted">
                        Packaging photo *
                        <input type="file" accept="image/*" onChange={handlePackagingPhoto} disabled={uploadingPhoto} className="mt-2 block w-full text-sm" />
                      </label>
                      <button onClick={handleCreateQr} disabled={actionLoading || uploadingPhoto} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-medium disabled:opacity-60">
                        {actionLoading ? 'Creating QR...' : selectedDonation.qrCodeToken ? 'Regenerate / View QR' : 'Create QR Code'}
                      </button>
                      {qrData && (
                        <div className="flex flex-col items-center gap-3 bg-white rounded-xl p-4">
                          <QRCodeSVG
                            data-donation-qr="true"
                            value={qrData.qrCodeToken}
                            size={220}
                            includeMargin
                          />
                          <p className="text-xs text-slate-600 text-center">Scan this code when dispensing the exact medicine to an approved recipient request.</p>
                          <button
                            type="button"
                            onClick={handleDownloadQr}
                            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                          >
                            Download QR ({getQrFilename(selectedDonation)})
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleVerify('APPROVED')}
                      disabled={actionLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="h-5 w-5" /> Approve & Add to Inventory
                    </button>
                    <button 
                      onClick={() => handleVerify('REJECTED')}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-md shadow-red-600/20"
                    >
                      <X className="h-5 w-5" /> Reject Donation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-xl shadow-sm border border-theme h-full flex items-center justify-center p-12">
              <div className="text-center">
                <ShieldCheck className="h-12 w-12 text-subtle mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-1">Select a donation</h3>
                <p className="text-muted">Choose a pending donation from the queue to review and verify.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingDonations;
