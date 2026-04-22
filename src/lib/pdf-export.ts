import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimation, Project } from '../types';

export function exportEstimationToPDF(project: Project, estimation: Estimation) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Building Estimation Report', 14, 22);
  
  doc.setFontSize(12);
  let currentY = 32;
  const addLine = (text: string) => {
    doc.text(text, 14, currentY);
    currentY += 6;
  };

  addLine(`Project: ${project.name}`);
  addLine(`Client: ${project.clientName}`);
  addLine(`Location: ${project.location}`);
  addLine(`Estimation Name: ${estimation.name}`);
  if (estimation.totalArea) addLine(`Total Area: ${estimation.totalArea} sq ft`);
  if (estimation.totalFloors) addLine(`Total Floors: ${estimation.totalFloors}`);
  addLine(`Date: ${new Date(estimation.createdAt).toLocaleDateString()}`);

  currentY += 8;

  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 14, currentY);
  currentY += 8;
  doc.setFontSize(11);
  doc.text(`Total Material Cost: Rs. ${estimation.totalMaterialCost.toLocaleString()}`, 14, currentY);
  currentY += 6;
  doc.text(`Total Labor Cost: Rs. ${estimation.totalLaborCost.toLocaleString()}`, 14, currentY);
  currentY += 6;
  doc.text(`Total Equipment Cost: Rs. ${estimation.totalEquipmentCost.toLocaleString()}`, 14, currentY);
  currentY += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: Rs. ${estimation.totalCost.toLocaleString()}`, 14, currentY);
  currentY += 6;
  doc.text(`Estimated Time: ${estimation.estimatedTimeDays} days`, 14, currentY);
  doc.setFont('helvetica', 'normal');

  currentY += 12;

  // Items Table
  const tableData = estimation.items.map(item => [
    item.category,
    item.description,
    item.unit,
    `Rs. ${item.unitCost.toLocaleString()}`,
    item.quantity.toString(),
    `Rs. ${item.totalCost.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Description', 'Unit', 'Rate', 'Qty', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${project.name.replace(/\s+/g, '_')}_Estimation.pdf`);
}
