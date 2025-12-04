export const generateBrandedPDF = (title, contentData, settings) => {
  if (!window.jspdf) { alert("Error PDF Library"); return; }
  const doc = new window.jspdf.jsPDF();
  const config = settings || {}; 
  const purple = "#522b85";
  const black = "#000000";
  
  // HEADER
  doc.setFillColor(purple);
  doc.rect(0, 0, 210, 45, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 45, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(purple);
  doc.text("SPACE AGENCIA CREATIVA", 105, 20, null, null, "center");
  
  doc.setFontSize(12);
  doc.setTextColor(black);
  doc.text(title.toUpperCase(), 105, 28, null, null, "center");
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`NIT: 1.007.559.344-5  |  Fecha: ${new Date().toLocaleDateString()}`, 105, 35, null, null, "center");

  doc.setDrawColor(purple);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);

  let finalY = 50;
  if (contentData) finalY = contentData(doc, 55);

  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 35;
  doc.setDrawColor(220);
  doc.setLineWidth(0.1);
  doc.line(20, footerY, 190, footerY);
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont("helvetica", "bold");
  
  let currentFooterY = footerY + 8;
  const lineHeight = 5;
  doc.text("www.spacecreativa.com", 105, currentFooterY, null, null, "center");
  currentFooterY += lineHeight;
  doc.text("Medellín - Colombia", 105, currentFooterY, null, null, "center");
  currentFooterY += lineHeight;
  doc.text("Redes sociales: @spacecreativa", 105, currentFooterY, null, null, "center");
  currentFooterY += lineHeight;
  doc.text("Teléfono: 310-6308458", 105, currentFooterY, null, null, "center");

  return doc;
};