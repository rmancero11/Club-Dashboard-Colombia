'use client';

type ToastVariant = 'default' | 'destructive' | 'success';
type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; 
};

const containerId = 'toaster-root';

function ensureContainer() {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.className =
      'pointer-events-none fixed top-4 right-4 z-[99999] flex flex-col gap-2';
    document.body.appendChild(el);
  }
  return el;
}

function variantClasses(variant: ToastVariant = 'default') {
  if (variant === 'destructive')
    return 'bg-red-600 text-white border-red-700';
  if (variant === 'success')
    return 'bg-emerald-600 text-white border-emerald-700';
  return 'bg-gray-900 text-white border-gray-800';
}

export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 4000,
  }: ToastOptions) => {
    if (typeof window === 'undefined') return;
    const root = ensureContainer();

    const card = document.createElement('div');
    card.className = `pointer-events-auto rounded-lg border px-4 py-3 shadow-lg ${variantClasses(
      variant
    )} animate-in fade-in-0 slide-in-from-top-2`;
    card.style.maxWidth = '360px';

    if (title) {
      const t = document.createElement('div');
      t.className = 'text-sm font-semibold';
      t.textContent = title;
      card.appendChild(t);
    }
    if (description) {
      const d = document.createElement('div');
      d.className = 'mt-1 text-xs opacity-90';
      d.textContent = description;
      card.appendChild(d);
    }

    root.appendChild(card);
    const timer = setTimeout(() => {
      card.classList.add('animate-out', 'fade-out-0', 'slide-out-to-top-2');
      setTimeout(() => card.remove(), 200);
    }, duration);

    card.addEventListener('click', () => {
      clearTimeout(timer);
      card.remove();
    });
  };

  return { toast };
}
