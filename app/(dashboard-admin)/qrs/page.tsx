'use client';
import { useState, useEffect, useMemo } from 'react';

import { Icon } from '@iconify/react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import QRCode from 'react-qr-code';

// components
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
// utils
import {
  generateRestaurantSucursalURL,
  generateRestaurantURL,
  generateWaiterBySucursalURL,
  generateWaiterURL,
} from '@/app/utils/qr';
import { cleanString } from '@/app/utils/strings';
import { useDebounce } from '@/app/hooks/utils/debounce';
import { Business, Waiter } from '@/app/types/business';
import { useBusinessDataContext } from '@/app/context/BusinessContext';
import { useSearchParams } from 'next/navigation';

function QRs() {
  const [businessData, setBusinessData] = useState<Business | null>();
  const [QRSizeRestaurants, setQRSizeRestaurants] = useState(256);
  const [QRSizeWaiters, setQRSizeWaiters] = useState(256);
  const debouncedQRSizeRestaurants = useDebounce(QRSizeRestaurants, 500);
  const debouncedQRSizeWaiters = useDebounce(QRSizeWaiters, 500);
  const [loading, setLoading] = useState(false);
  const [isBranch, setIsBranch] = useState(false);
  // eslint-disable-next-line no-undef
  const [waitersSucursalesFixed, setWaitersSucursalesFixed] = useState<
    Waiter[] | undefined
  >([]);

  // hooks
  const businessDataContext = useBusinessDataContext();
  const searchParams = useSearchParams();

  const filteredBusinessData = useMemo(
    () => businessDataContext?.filteredBusinessData,
    [businessDataContext?.filteredBusinessData]
  );

  const businessId = businessData?.Id as string;
  const parentId = businessData?.parentId;
  const isDsc = businessData?.parentId === 'dsc-solutions';

  const waiters = businessData?.meseros;
  const waitersSucursales = businessData?.sucursales?.flatMap(
    (branch) => branch?.meseros
  );
  const sucursales = businessData?.sucursales;

  const RESTAURANS_ZIPNAME = `${cleanString(
    businessData?.Name as string
  )}-restaurant-qrs.zip`;
  const WAITERS_ZIPNAME = `${cleanString(
    businessData?.Name as string
  )}-restaurant-qrs.zip`;

  useEffect(() => {
    setBusinessData(filteredBusinessData);
  }, [businessData, businessDataContext, filteredBusinessData]);

  useEffect(() => {
    const branch = searchParams.get('sucursal');
    setIsBranch(branch != undefined && branch != 'todas');
  }, [searchParams]);

  const downloadQRs = async ({
    className,
    zipName,
  }: {
    className: string;
    zipName: string;
  }) => {
    setLoading(true);
    try {
      const items = document.querySelectorAll(className);
      const svgs = Array.from(items);
      const ids = svgs?.map((item) => item?.id);
      const zip = new JSZip();

      const promises = svgs?.map((svg, index) => {
        return new Promise((resolve, reject) => {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas?.getContext('2d');
          const img = new Image();
          if (!ctx) return reject(new Error('canvas ctx not intialized'));

          img.onload = async () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const png = canvas.toDataURL('image/png');
            const cleanPng = png.replace(/^data:image\/(png|jpg);base64,/, '');
            const filename = `${cleanString(ids[index])}.png`;
            zip.file(filename, cleanPng, { base64: true });
            resolve(null);
          };

          img.onerror = (e) => {
            console.log('error: ', e);
            reject(new Error('Failed to load SVG image'));
          };
          const src = `data:image/svg+xml;base64,${btoa(svgData)}`;
          img.src = src;
        });
      });
      await Promise.all(promises);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, zipName);
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };

  const downloadRestaurantsQRs = () =>
    downloadQRs({
      className: '.qr-restaurants svg',
      zipName: RESTAURANS_ZIPNAME,
    });
  const downloadWaitersQRs = () =>
    downloadQRs({ className: '.qr-waiters svg', zipName: WAITERS_ZIPNAME });

  return (
    <>
      <section className="w-full overflow-x-hidden px-4">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col">
            <div className="flex items-center md:items-end justify-between">
              <h4 className="font-bold text-primary md:text-xl">
                {isDsc ? 'Business' : 'Restaurantes'}
              </h4>
              <Button onClick={downloadRestaurantsQRs} disabled={loading}>
                <div className="flex gap-2 items-center">
                  <p>{isDsc ? 'Download' : 'Descargar'}</p>
                  <Icon icon="material-symbols:download" />
                </div>
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-1 items-end">
              <p className="text-gray-400 font-bold text-sm">
                {isDsc ? 'Size' : 'Tamaño'} (px)
              </p>
              <div className="flex items-center justify-center md:justify-start gap-1">
                <Input
                  type="number"
                  className="w-32"
                  min={30}
                  max={1000}
                  value={Number(QRSizeRestaurants)?.toString()}
                  onChange={(e) =>
                    setQRSizeRestaurants(Number(e?.target?.value))
                  }
                />
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setQRSizeRestaurants(256)}>
                  <Icon icon="mdi:reload" />
                </Button>
              </div>
            </div>
            <div className="mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-center qr-restaurants">
                <div className="flex flex-col items-center gap-3 w-full text-primary">
                  <QRCode
                    id={`${cleanString(`${businessData?.Name}-main-qr`)}`}
                    value={
                      isBranch
                        ? generateRestaurantSucursalURL(
                            businessData?.parentId as string,
                            businessData?.Id as string
                          )
                        : generateRestaurantURL(businessData?.Id as string)
                    }
                    size={debouncedQRSizeRestaurants}
                  />
                  <p className="font-bold">{businessData?.Name}</p>
                </div>

                {sucursales?.map((sucursal, index) => (
                  <div
                    className="flex flex-col items-center gap-3 text-primary"
                    key={`qr-sucursal-${index}`}>
                    <QRCode
                      id={`${cleanString(`${sucursal?.Name}-sucursal-qr`)}`}
                      value={generateRestaurantSucursalURL(
                        businessId,
                        sucursal?.Id
                      )}
                      size={debouncedQRSizeRestaurants}
                    />
                    <p className="font-bold">{sucursal?.Name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-warning md:text-xl">
                {isDsc ? 'Tablets' : 'Meseros'}
              </h4>
              <Button
                variant="secondary"
                onClick={downloadWaitersQRs}
                disabled={loading}>
                <div className="flex gap-2 items-center">
                  <p>{isDsc ? 'Download' : 'Descargar'}</p>
                  <Icon icon="material-symbols:download" />
                </div>
              </Button>
            </div>
            <div className="flex flex-col items-end mt-4">
              <p className="text-gray-400 font-bold text-sm">
                {isDsc ? 'Size' : 'Tamaño'} (px)
              </p>
              <div className="py-2 flex items-center justify-center md:justify-start gap-1">
                <Input
                  type="number"
                  className="w-32"
                  min={30}
                  max={1000}
                  value={Number(QRSizeWaiters)?.toString()}
                  onChange={(e) => setQRSizeWaiters(Number(e?.target?.value))}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQRSizeWaiters(256)}>
                  <Icon icon="mdi:reload" />
                </Button>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 place-items-center gap-8">
              {!waitersSucursales &&
                waiters?.map((waiter, index) => (
                  <div
                    className="flex flex-col items-center gap-4 qr-waiters"
                    key={`qr-waiter-${index}`}>
                    <QRCode
                      id={`${cleanString(`${waiter?.name}-main-waiter-qr`)}`}
                      value={generateWaiterURL(
                        businessId,
                        waiter?.id,
                        parentId
                      )}
                      size={debouncedQRSizeWaiters}
                    />
                    <p className="font-bold text-warning">{waiter?.name}</p>
                  </div>
                ))}
              {waitersSucursales?.map((waiter, index) => (
                <div
                  className="flex flex-col items-center gap-4 qr-waiters"
                  key={`qr-waiter-sucursal-${index}`}>
                  <QRCode
                    id={`${cleanString(
                      `${waiter?.name}-sucursal-qr-${waiter?.sucursal?.Name}`
                    )}`}
                    value={generateWaiterBySucursalURL(
                      businessId,
                      waiter?.sucursalId || '',
                      waiter?.id || ''
                    )}
                    size={debouncedQRSizeWaiters}
                  />
                  <p className="font-bold text-warning">{waiter?.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default QRs;
