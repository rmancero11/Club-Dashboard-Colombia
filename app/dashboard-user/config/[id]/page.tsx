'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type UserShape = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  country?: string | null;
  preference?: string | null;
  singleStatus?: string | null;
  affirmation?: string | null;
  avatar?: string | null;
  dniFile?: string | null;
  passportFile?: string | null;
  visaFile?: string | null;
  purchaseOrder?: string | null;
  flightTickets?: string | null;
  serviceVoucher?: string | null;
  medicalAssistanceCard?: string | null;
  travelTips?: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
  });

  const [dniFile, setDniFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);

  // 🔹 Cargar usuario al inicio
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files?.[0]) return;

    switch (name) {
      case 'dni': setDniFile(files[0]); break;
      case 'passport': setPassportFile(files[0]); break;
      case 'visa': setVisaFile(files[0]); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('email', form.email);

    if (dniFile) formData.append('dni', dniFile);
    if (passportFile) formData.append('passport', passportFile);
    if (visaFile) formData.append('visa', visaFile);

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Error al actualizar perfil');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard-user'), 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const userFiles = [
    { label: 'DNI', stateFile: dniFile, existing: user?.dniFile, editable: true },
    { label: 'Pasaporte', stateFile: passportFile, existing: user?.passportFile, editable: true },
    { label: 'Visa', stateFile: visaFile, existing: user?.visaFile, editable: true },
    { label: 'Purchase Order', stateFile: null, existing: user?.purchaseOrder, editable: false },
    { label: 'Flight Tickets', stateFile: null, existing: user?.flightTickets, editable: false },
    { label: 'Service Voucher', stateFile: null, existing: user?.serviceVoucher, editable: false },
    { label: 'Medical Assistance Card', stateFile: null, existing: user?.medicalAssistanceCard, editable: false },
    { label: 'Travel Tips', stateFile: null, existing: user?.travelTips, editable: false },
  ];

  if (!user) return <p className="text-center mt-10">Cargando perfil...</p>;

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-8">
  <h1 className="text-2xl font-bold mb-6 text-center">Editar perfil</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Columna izquierda */}
    <div className="space-y-4">
      {/* Avatar */}
      <div className="flex justify-center mb-4 md:justify-start">
        <Image
          src={user.avatar || '/images/default-avatar.png'}
          alt={user.name || 'Avatar del usuario'}
          width={120}
          height={120}
          className="rounded-full border-4 border-purple-500 object-cover"
        />
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Teléfono solo lectura */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Teléfono</label>
        <input
          value={user.phone || 'No especificado'}
          disabled
          className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* País solo lectura */}
      <div>
        <label className="block text-sm font-medium text-gray-700">País</label>
        <input
          value={user.country || 'No especificado'}
          disabled
          className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 cursor-not-allowed"
        />
      </div>

      {/* Campos no editables */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Preferencias</label>
        <input
          value={user.preference || 'No especificado'}
          disabled
          className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Soltero/a</label>
        <input
          value={user.singleStatus || 'No especificado'}
          disabled
          className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Afirmación personal</label>
        <input
          value={user.affirmation || 'No especificado'}
          disabled
          className="mt-1 w-full rounded-md border-gray-200 bg-gray-100 cursor-not-allowed"
        />
      </div>
    </div>

    {/* Columna derecha - Archivos */}
    <div className="space-y-4">
      {userFiles.map((f) => (
        <div key={f.label}>
          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
          {['DNI', 'Pasaporte', 'Visa'].includes(f.label) ? (
            <input
              type="file"
              name={f.label.toLowerCase()}
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="mt-1 w-full"
            />
          ) : null}
          <p className="text-sm text-gray-500 mt-1">
            {f.stateFile?.name || 'No subido'}
          </p>
        </div>
      ))}
    </div>

    {/* Botón centrado al final */}
    <div className="md:col-span-2 flex justify-center mt-6">
      <button
        type="submit"
        disabled={loading}
        onClick={handleSubmit}
        className="w-1/2 bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
      >
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  </div>

  {success && (
    <p className="text-center text-green-600 mt-3">
      Perfil actualizado correctamente ✅
    </p>
  )}
</div>


  );
}
