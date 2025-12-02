import { useState, useEffect } from 'react';

/**
 * Hook para crear un contador regresivo simple.
 * Se usa para dar al usuario feedback sobre el tiempo de espera.
 *
 * @param initialCount - El número inicial del contador (ej: 10 segundos).
 * @returns El valor actual del contador.
 */
export const useCountdown = (initialCount: number = 5): number => {
    // 1. Estado para el valor del contador
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        // 2. Si la cuenta llega a 0, la reiniciamos.
        // Esto mantiene el mensaje de carga visible con el número inicial
        // si la carga de datos es más lenta que el contador.
        if (count === 0) {
            setCount(initialCount);
            return;
        }

        // 3. Configurar el temporizador para decrementar cada 1000ms (1 segundo)
        const timer = setTimeout(() => {
            setCount(count - 1);
        }, 1000);

        // 4. Limpieza: Borrar el temporizador cuando el componente se desmonta 
        // o antes de ejecutar el efecto de nuevo.
        return () => clearTimeout(timer);

    // Las dependencias aseguran que el efecto se re-ejecute cuando 'count' cambie.
    }, [count, initialCount]); 
    
    return count;
};