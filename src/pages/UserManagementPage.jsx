import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

// This is the form component used inside the modal for adding or editing a user.
function UserForm({ user, onSuccess, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    name: user?.name || '',
    role: user?.role || 'viewer',
    satkerId: user?.satkerId || '',
    password: '',
  });

  // Fetch the list of Satkers to populate the dropdown
  const { data: satkerList, isLoading: isLoadingSatkers } = useQuery({
    queryKey: ['satkers'],
    queryFn: () => apiClient.get('/satker').then((res) => res.data),
  });

  // If the user being edited changes, update the form data
  useEffect(() => {
    setFormData({
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'viewer',
      satkerId: user?.satkerId || '',
      password: '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In edit mode, if password is blank, don't send it so it isn't updated
    const payload = { ...formData };
    if (user?.id && !payload.password) {
      delete payload.password;
    }
    onSuccess(payload);
  };

  const isSatkerRole =
    formData.role === 'op_satker' || formData.role === 'viewer';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Nama Lengkap</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>
      <div>
        <label className="form-label">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          disabled={!!user}
          required
        />
        {user && (
          <p className="text-xs text-gray-500 mt-1">
            Email tidak dapat diubah.
          </p>
        )}
      </div>
      <div>
        <label className="form-label">Peran (Role)</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="form-input"
        >
          <option value="supervisor">Supervisor</option>
          <option value="op_prov">Operator Provinsi</option>
          <option value="op_satker">Operator Satker</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
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
      <div>
        <label className="form-label">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          placeholder={user ? 'Kosongkan jika tidak ingin diubah' : ''}
          required={!user}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary" disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan Pengguna'}
        </button>
      </div>
    </form>
  );
}

// This is the main page component
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
              Tambah, edit, atau hapus akun pengguna sistem.
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Peran
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Satuan Kerja
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.satker?.nama || 'BPS Provinsi Gorontalo'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => openModal(user)}
                          className="inline-flex items-center gap-1.5 text-bpsBlue-dark hover:text-bpsBlue-light font-semibold"
                        >
                          <Edit size={14} /> <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="inline-flex items-center gap-1.5 text-danger hover:text-danger-dark font-semibold"
                        >
                          <Trash2 size={14} /> <span>Hapus</span>
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
