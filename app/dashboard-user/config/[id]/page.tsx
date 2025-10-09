'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    country: '',
  });

  const [dniFile, setDniFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [visaFile, setVisaFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files?.[0]) return;

    if (name === 'dni') setDniFile(files[0]);
    if (name === 'passport') setPassportFile(files[0]);
    if (name === 'visa') setVisaFile(files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('phone', form.phone);
    formData.append('country', form.country);
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

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Editar perfil</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-700">País</label>
          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        {/* DNI */}
        <div>
          <label className="block text-sm font-medium text-gray-700">DNI (archivo)</label>
          <input
            type="file"
            name="dni"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {/* PASAPORTE */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Pasaporte</label>
          <input
            type="file"
            name="passport"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {/* VISA */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Visa</label>
          <input
            type="file"
            name="visa"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>

        {/* BOTÓN */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {success && (
          <p className="text-center text-green-600 mt-3">
            Perfil actualizado correctamente ✅
          </p>
        )}
      </form>
    </div>
  );
}
