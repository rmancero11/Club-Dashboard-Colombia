export const revalidate = 0; 

import ResetForm from "./ResetForm";

export default function Page({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams?.token ?? "";

  if (!token) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Enlace inválido</h1>
        <p className="text-sm text-gray-600">Falta el token en la URL.</p>
      </div>
    );
  }

  return <ResetForm token={token} />;
}
