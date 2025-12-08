// src/pages/UserManagementPage.jsx

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Info } from 'lucide-react';

// Form component for Adding/Editing users
function UserForm({ user, onSuccess, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    role: user?.role || 'viewer', // Default role
    satkerId: user?.satkerId || '',
  });

  // Fetch Satker list for the dropdown
  const { data: satkerList, isLoading: isLoadingSatkers } = useQuery({
    queryKey: ['satkers'],
    queryFn: () => apiClient.get('/satker').then((res) => res.data),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'viewer',
        satkerId: user.satkerId || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Send full payload (Email, Name, Role, Satker)
    const payload = { ...formData };

    onSuccess(payload);
  };

  // Check if the selected role requires a Satker
  const isSatkerRole =
    formData.role === 'op_satker' || formData.role === 'viewer';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* EMAIL: Read-only in Edit mode */}
      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          disabled={!!user}
          placeholder="nama.pengguna@bps.go.id"
          required
        />
        {user && (
          <p className="text-xs text-gray-500 mt-1">
            Email tidak dapat diubah.
          </p>
        )}
      </div>

      {/* NAME: Editable in BOTH modes now */}
      <div>
        <label className="form-label">Nama Lengkap</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          placeholder={!user ? 'Masukkan nama lengkap (Opsional)' : ''}
        />
        {!user && (
          <p className="text-xs text-gray-500 mt-1">
            Jika dikosongkan, nama akan diambil otomatis dari email.
          </p>
        )}
      </div>

      {/* ROLE */}
      <div>
        <label className="form-label">Peran (Role)</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-input"
        >
          <option value="op_prov">Operator Provinsi</option>
          <option value="supervisor">Supervisor</option>
          <option value="op_satker">Operator Satker</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* SATKER: Conditional */}
      {isSatkerRole && (
        <div>
          <label className="form-label">Satuan Kerja (Satker)</label>
          <select
            name="satkerId"
            value={formData.satkerId}
            onChange={handleChange}
            className="form-input"
            disabled={isLoadingSatkers}
            required={isSatkerRole}
          >
            <option value="">-- Pilih Satker --</option>
            {satkerList?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* INFO BOX: Only about Password now */}
      {!user && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex gap-3 items-start">
          <Info className="text-blue-500 mt-0.5 shrink-0" size={18} />
          <div className="text-sm text-blue-700">
            <p>
              <strong>Password</strong> akan diatur secara acak (Login via
              IMAP/Email).
            </p>
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving
            ? 'Menyimpan...'
            : user
            ? 'Simpan Perubahan'
            : 'Tambah Pengguna'}
        </button>
      </div>
    </form>
  );
}

// Main Page Component
function UserManagementPage() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState({ isOpen: false, user: null });

  const {
    data: users,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then((res) => res.data),
  });

  const saveUserMutation = useMutation({
    mutationFn: (userData) => {
      // Determine if Create or Update based on modal state
      return modalState.user?.id
        ? apiClient.put(`/users/${modalState.user.id}`, userData)
        : apiClient.post('/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalState({ isOpen: false, user: null });
    },
    onError: (err) =>
      alert(err.response?.data?.error || 'Gagal menyimpan pengguna.'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => apiClient.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) =>
      alert(err.response?.data?.error || 'Gagal menghapus pengguna.'),
  });

  const handleDelete = (user) => {
    if (
      window.confirm(
        `Anda yakin ingin menghapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const openModal = (user = null) => {
    setModalState({ isOpen: true, user: user });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Pengguna
            </h1>
            <p className="text-gray-500 mt-1">
              Kelola akses dan peran pengguna aplikasi.
            </p>
          </div>
          <button
            onClick={() => openModal()}
            className="btn-primary w-full md:w-auto"
          >
            <Plus size={18} />
            <span>Tambah Pengguna</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          {isLoading && (
            <p className="text-center text-gray-500 py-10">
              Memuat data pengguna...
            </p>
          )}
          {isError && (
            <p className="text-center text-red-500 py-10">
              Error: {error.message}
            </p>
          )}

          {!isLoading && !isError && users && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Satuan Kerja
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.satker?.nama || 'BPS Provinsi Gorontalo'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => openModal(user)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} /> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, user: null })}
        title={modalState.user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      >
        <UserForm
          user={modalState.user}
          onSuccess={(data) => saveUserMutation.mutate(data)}
          onCancel={() => setModalState({ isOpen: false, user: null })}
          isSaving={saveUserMutation.isPending}
        />
      </Modal>
    </>
  );
}

export default UserManagementPage;
