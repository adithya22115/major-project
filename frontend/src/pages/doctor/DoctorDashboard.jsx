import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { getDoctorAppointments, updateDoctorAppointmentStatus } from '../../services/doctorAppointmentService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setAppointments(await getDoctorAppointments()); }
    catch (_err) { toast.error('Could not load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await updateDoctorAppointmentStatus(id, status);
      toast.success(`Appointment ${status.toLowerCase()}`);
      load();
    } catch (_err) { toast.error('Could not update appointment'); }
  };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div><h1 className="text-2xl font-bold text-primary">Doctor Workspace</h1><p className="text-muted mt-1">Review and manage patient consultation requests.</p></div>
      <div className="space-y-3">
        {appointments.length === 0 && <div className="bg-surface border border-theme rounded-xl p-8 text-center text-muted">No consultation requests yet.</div>}
        {appointments.map(appointment => (
          <div key={appointment.id} className="bg-surface border border-theme rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h2 className="font-semibold text-primary">{appointment.patientName}</h2>
                <p className="text-sm text-muted">{appointment.specialty} · {appointment.consultationType}</p>
                <p className="text-sm text-muted mt-2">{appointment.phone}</p>
                {appointment.notes && <p className="text-sm text-primary mt-3">{appointment.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-full text-xs border border-blue-500/30 text-blue-400">{appointment.status}</span>
                {appointment.status === 'REQUESTED' && <>
                  <button onClick={() => update(appointment.id, 'CONFIRMED')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"><CheckCircle className="inline w-4 h-4 mr-1" />Confirm</button>
                  <button onClick={() => update(appointment.id, 'CANCELLED')} className="px-3 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm"><XCircle className="inline w-4 h-4 mr-1" />Decline</button>
                </>}
                {appointment.status === 'CONFIRMED' && <button onClick={() => update(appointment.id, 'COMPLETED')} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"><Clock className="inline w-4 h-4 mr-1" />Complete</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorDashboard;
