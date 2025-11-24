export const formatCurrency = (value, currency = 'COP') => {
  let locale = 'es-CO';
  if (currency === 'USD') locale = 'en-US';
  if (currency === 'EUR') locale = 'de-DE'; 
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};

export const convertToBase64 = (file) => {
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
        if (width > 500) {
          height *= 500 / width;
          width = 500;
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

export const motivationalQuotes = [
  "La creatividad es la inteligencia divirtiéndose.",
  "El diseño es el embajador silencioso de tu marca.",
  "No busques clientes, busca fans de tu trabajo.",
  "La calidad es el mejor plan de negocios.",
  "Hazlo simple, pero significativo.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día."
];