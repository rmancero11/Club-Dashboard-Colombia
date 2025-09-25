'use client'

import axios from 'axios';
import { Button } from '@/app/components/ui/Button';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { saveSessionId } from '@/app/services/qikConnect';
import { useBusinessDataContext } from '@/app/context/BusinessContext';

function QrCodeDisplay({ qrCode, loading }: { qrCode: string; loading: boolean }) {
  return loading ? (
    <p>Cargando código QR...</p>
  ) : qrCode ? (
    <div className="mt-4">
      <h2>Escanea este código QR:</h2>
      <Image
        src={qrCode}
        alt="Código QR"
        className="w-64 h-64"
        width={64}
        height={64}
      />
    </div>
  ) : (
    <p>No se encontró un código QR para este cliente.</p>
  );
}

function QikConnect() {
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [businessId, setBusinessId] = useState<string>('')
  const businessDataContext = useBusinessDataContext();
  const [clientId, setClientId] = useState<string>(businessDataContext?.filteredBusinessData?.sessionId || "")

  useEffect(() => {
    setBusinessId(businessDataContext?.filteredBusinessData?.parentId || '');
  }, [businessDataContext]);


  const fetchQrCode = useCallback(async () => {
    try{
      const response = await axios.get(`https://8d5f-2800-bf0-10b-f69-41d-a7ef-8a49-92cc.ngrok-free.app/api/qr/${clientId}`, {
        responseType: "arraybuffer",
      });

      const qrImage = `data:image/png;base64,${btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      )}`;
      setQrCode(qrImage);
    } catch (error) {
      console.error("Error al obtener el código QR:", error);
    } finally {
      setLoading(false);
    }
  }, [clientId, setQrCode, setLoading]);

  const handleCreateClient = async () => {
    const generatedClientId = "id" + Math.random().toString(16).slice(2);
    setClientId(generatedClientId)
    try {
      const response = await axios.post(`https://8d5f-2800-bf0-10b-f69-41d-a7ef-8a49-92cc.ngrok-free.app/api/create-client/${clientId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        await saveSessionId(businessId, clientId)
        const data = await response.data;
        alert("Cliente creado exitosamente: " + JSON.stringify(data));
        fetchQrCode();
      } else {
        alert("Error al crear el cliente: " + response.statusText);
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      alert("Ocurrió un error al intentar crear el cliente.");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchQrCode();
    }, 1000);

    return () => clearInterval(interval);
  }, [clientId, fetchQrCode]);

  return (
    <section className="w-full overflow-x-hidden px-4">
      <h1>Qik Connect</h1>
      <Button
        onClick={handleCreateClient}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
      >
        Iniciar sesión en WhatsApp
      </Button>
      <QrCodeDisplay qrCode={qrCode} loading={loading} />
    </section>
  );
}

export default QikConnect;
