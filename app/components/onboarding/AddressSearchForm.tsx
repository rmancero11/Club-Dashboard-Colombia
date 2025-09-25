import { Control, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/Form';
import { Input } from '../ui/Input';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { useEffect, useRef, useState } from 'react';
import { GeoPoint } from 'firebase/firestore';

export default function AddressSearchForm({
  label,
  control,
  addressFieldID,
  mapURLFieldID,
  geopointFieldID,
  disabled,
}: {
  label: string;
  control: Control;
  disabled: boolean;
  addressFieldID: string;
  mapURLFieldID: string;
  geopointFieldID: string;
}) {
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);

  return (
    <APIProvider
      apiKey={process.env.NEXT_PUBLIC_VITE_APP_GOOGLE_API_KEY ?? ''}
      solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
      <FormField
        control={control}
        name={geopointFieldID}
        render={({ field: geopointURL }) => (
          <FormField
            control={control}
            name={mapURLFieldID}
            render={({ field: fieldMapsURL }) => (
              <FormField
                control={control}
                name={addressFieldID}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <PlaceAutocomplete
                        onPlaceSelect={setSelectedPlace}
                        field={field}
                        fieldMapsURL={fieldMapsURL}
                        geopointURL={geopointURL}
                        disabled={disabled}
                        value={selectedPlace?.formatted_address}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />
        )}
      />
    </APIProvider>
  );
}

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  field: FieldValues;
  fieldMapsURL: FieldValues;
  geopointURL: FieldValues;
  disabled: boolean;
  value?: string;
}

const PlaceAutocomplete = ({
  onPlaceSelect,
  field,
  fieldMapsURL,
  geopointURL,
  disabled,
  value,
}: PlaceAutocompleteProps) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['place_id', 'formatted_address', 'geometry'],
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      const newPlace = placeAutocomplete.getPlace();

      onPlaceSelect(newPlace);
      field.onChange(newPlace.formatted_address);

      fieldMapsURL.onChange(newPlace.place_id);
      const lat = newPlace.geometry?.location?.lat();
      const lng = newPlace.geometry?.location?.lng();
      if (lat && lng) {
        geopointURL.onChange(new GeoPoint(lat, lng));
      }
    });
  }, [onPlaceSelect, placeAutocomplete, field, fieldMapsURL, geopointURL]);

  return (
    <div className="autocomplete-container">
      <Input
        ref={inputRef}
        // value={value ?? field.value}
        placeholder="Calle 123 # 123-123"
        disabled={disabled}
      />
    </div>
  );
};
