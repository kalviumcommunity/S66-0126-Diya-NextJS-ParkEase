'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Slot {
  id: string;
  row: number;
  column: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  pricePerHour: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>(
    'AVAILABLE'
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      if (payload.role !== 'ADMIN') {
        router.push('/');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }

    const fetchSlots = async () => {
      try {
        const response = await fetch('/api/slots', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch slots');
        const data = await response.json();
        setSlots(data.data?.items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [router]);

  const handleUpdateSlot = async () => {
    if (!selectedSlot) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/slots', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          status: updateStatus,
        }),
      });

      if (!response.ok) throw new Error('Failed to update slot');

      setSlots(slots.map((s) => (s.id === selectedSlot.id ? { ...s, status: updateStatus } : s)));
      setSelectedSlot(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-bold text-red-900 mb-2">Error</h2>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  const stats = {
    total: slots.length,
    available: slots.filter((s) => s.status === 'AVAILABLE').length,
    occupied: slots.filter((s) => s.status === 'OCCUPIED').length,
    reserved: slots.filter((s) => s.status === 'RESERVED').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'OCCUPIED':
        return 'bg-red-100 text-red-800';
      case 'RESERVED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Total Slots</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Available</p>
          <p className="text-3xl font-bold text-green-600">{stats.available}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Occupied</p>
          <p className="text-3xl font-bold text-red-600">{stats.occupied}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-2">Reserved</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.reserved}</p>
        </div>
      </div>

      {/* Slots Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Slot</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Price/Hour</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {slots.map((slot) => (
                <tr key={slot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    Row {slot.row}, Column {slot.column}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(slot.status)}`}
                    >
                      {slot.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${slot.pricePerHour.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedSlot(slot);
                        setUpdateStatus(slot.status);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Update Slot {selectedSlot.row}-{selectedSlot.column}
            </h2>

            <div className="space-y-4 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 mb-2 block">New Status</span>
                <select
                  value={updateStatus}
                  onChange={(e) =>
                    setUpdateStatus(e.target.value as 'AVAILABLE' | 'OCCUPIED' | 'RESERVED')
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </label>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSlot}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
