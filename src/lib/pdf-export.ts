import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Estimation, Project } from '../types';

export function exportEstimationToPDF(project: Project, estimation: Estimation) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Building Estimation Report', 14, 22);
  
  doc.setFontSize(12);
  doc.text(`Project: ${project.name}`, 14, 32);
  doc.text(`Client: ${project.clientName}`, 14, 38);
  doc.text(`Location: ${project.location}`, 14, 44);
  doc.text(`Estimation Name: ${estimation.name}`, 14, 50);
  doc.text(`Date: ${new Date(estimation.createdAt).toLocaleDateString()}`, 14, 56);

  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 14, 70);
  doc.setFontSize(11);
  doc.text(`Total Material Cost: Rs. ${estimation.totalMaterialCost.toLocaleString()}`, 14, 78);
  doc.text(`Total Labor Cost: Rs. ${estimation.totalLaborCost.toLocaleString()}`, 14, 84);
  doc.text(`Total Equipment Cost: Rs. ${estimation.totalEquipmentCost.toLocaleString()}`, 14, 90);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total: Rs. ${estimation.totalCost.toLocaleString()}`, 14, 98);
  doc.text(`Estimated Time: ${estimation.estimatedTimeDays} days`, 14, 104);
  doc.setFont('helvetica', 'normal');

  // Items Table
  const tableData = estimation.items.map(item => [
    item.category,
    item.description,
    item.type,
    item.quantity.toString(),
    item.unit,
    `Rs. ${item.unitCost.toLocaleString()}`,
    `Rs. ${item.totalCost.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['Category', 'Description', 'Type', 'Qty', 'Unit', 'Unit Cost', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${project.name.replace(/\s+/g, '_')}_Estimation.pdf`);
}
