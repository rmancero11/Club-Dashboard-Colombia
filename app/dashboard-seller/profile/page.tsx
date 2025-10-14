'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SellerProfilePage() {
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [currentlyLink, setCurrentlyLink] = useState('');
  const [currentWhatsapp, setCurrentWhatsapp] = useState('');
  const [currentCalendly, setCurrentCalendly] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 🔹 Cargar datos existentes del vendedor
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setPreview(data.user.avatar || null);
          setCurrentWhatsapp(data.user.whatsappNumber || '');
          setCurrentCalendly(data.user.currentlyLink || '');
        }
      } catch (err) {
        console.error('Error fetching seller data', err);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Subir avatar si hay uno nuevo
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);
        await fetch('/api/user/avatar', { method: 'POST', body: formData });
      }

      // Actualizar links del vendedor
      await fetch('/api/seller', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappNumber, currentlyLink }),
      });

      setMessage('Perfil actualizado correctamente.');

      // Actualizar los valores actuales con los que se acaban de guardar
      if (whatsappNumber) setCurrentWhatsapp(whatsappNumber);
      if (currentlyLink) setCurrentCalendly(currentlyLink);

      // Limpiar los inputs si querés
      setWhatsappNumber('');
      setCurrentlyLink('');
    } catch (error) {
      console.error(error);
      setMessage('Error al actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Mi Perfil</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium mb-1">Foto de perfil</label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <Image
                src={preview || '/images/default-avatar.png'}
                alt="Avatar"
                fill
                className="rounded-full object-cover border"
              />
            </div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium mb-1">Link de WhatsApp</label>
          {currentWhatsapp && (
            <p className="text-xs text-gray-500 mb-1">
              Link actual: <a href={currentWhatsapp} target="_blank" className="text-blue-600 underline">{currentWhatsapp}</a>
            </p>
          )}
          <input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="Escribe un nuevo link si querés cambiarlo"
            className="w-full border rounded-lg p-2"
          />
        </div>

        {/* Calendly */}
        <div>
          <label className="block text-sm font-medium mb-1">Link de Calendly</label>
          {currentCalendly && (
            <p className="text-xs text-gray-500 mb-1">
              Link actual: <a href={currentCalendly} target="_blank" className="text-blue-600 underline">{currentCalendly}</a>
            </p>
          )}
          <input
            type="text"
            value={currentlyLink}
            onChange={(e) => setCurrentlyLink(e.target.value)}
            placeholder="Escribe un nuevo link si querés cambiarlo"
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>

        {message && <p className="text-sm text-center text-gray-700 mt-2">{message}</p>}
      </form>
    </div>
  );
}
