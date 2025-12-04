import { Copy } from 'lucide-react';

// --- Constantes de Datos (Hardcoded según tu código v35) ---
export const PAYMENT_ACCOUNTS = [
  { id: 'bancolombia_luis', type: 'Bancolombia Ahorros', number: '91200070645', owner: 'Luis Julio', currency: 'COP' },
  { id: 'bancolombia_isra', type: 'Bancolombia Ahorros', number: '25300005893', owner: 'Israel Subero', currency: 'COP' },
  { id: 'paypal_luis', type: 'Paypal', number: 'lmjulio87@gmail.com', owner: 'Luis Julio', currency: 'USD/EUR' },
  { id: 'paypal_isra', type: 'Paypal', number: 'israsubero@gmail.com', owner: 'Israel Subero', currency: 'USD/EUR' },
];

export const SERVICES_CATALOG = [
  { name: 'Gestión Redes Sociales (Básico)', prices: { COP: 1200000, USD: 350, EUR: 320 } },
  { name: 'Gestión Redes Sociales (Pro)', prices: { COP: 2500000, USD: 700, EUR: 650 } },
  { name: 'Diseño de Logotipo', prices: { COP: 800000, USD: 250, EUR: 230 } },
  { name: 'Diseño Página Web (Landing)', prices: { COP: 1500000, USD: 450, EUR: 420 } },
  { name: 'Manual de Marca', prices: { COP: 2000000, USD: 600, EUR: 550 } },
  { name: 'Consultoría (Hora)', prices: { COP: 200000, USD: 60, EUR: 55 } },
];

export const motivationalQuotes = [
  "La creatividad es la inteligencia divirtiéndose.",
  "El diseño es el embajador silencioso de tu marca.",
  "No busques clientes, busca fans de tu trabajo.",
  "La calidad es el mejor plan de negocios.",
  "Hazlo simple, pero significativo.",
  "El éxito es la suma de pequeños esfuerzos repetidos día día."
];

// --- Funciones de Ayuda ---
export const formatCurrency = (value, currency = 'COP') => {
  let locale = 'es-CO';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'EUR') locale = 'de-DE'; 
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value || 0);
};

export const processImage = (file, maxWidth = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const convertToBase64 = (file) => {
  return processImage(file, 600); 
};