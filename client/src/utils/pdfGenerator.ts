
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event } from '../types/Event';
import type { Transaction } from '../types/Transaction';

export const generateRequisitionPDF = (event: Event, selectedTransactions: Transaction[]) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(`Solicitação de Itens - ${event.name}`, 14, 22);

    // Event Details
    doc.setFontSize(12);
    let yPos = 32;

    doc.setFont('helvetica', 'bold');
    doc.text(`Evento:`, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${event.name}`, 40, yPos);
    yPos += 6;

    if (event.eventCode) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Código:`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${event.eventCode}`, 40, yPos);
        yPos += 6;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`Data:`, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${new Date(event.startDate).toLocaleDateString('pt-BR')} até ${new Date(event.endDate).toLocaleDateString('pt-BR')}`, 40, yPos);
    yPos += 6;

    if (event.location) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Local:`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${event.location}`, 40, yPos);
        yPos += 6;
    }

    if (event.project) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Projeto:`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${event.project}`, 40, yPos);
        yPos += 6;
    }

    if (event.action) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Ação:`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${event.action}`, 40, yPos);
        yPos += 6;
    }

    if (event.responsibleUnit) {
        doc.setFont('helvetica', 'bold');
        doc.text(`Unidade:`, 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${event.responsibleUnit}`, 40, yPos);
        yPos += 6;
    }

    if (event.description) {
        yPos += 4;
        doc.setFont('helvetica', 'bold');
        doc.text(`Descrição:`, 14, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const splitDescription = doc.splitTextToSize(event.description, 180);
        doc.text(splitDescription, 14, yPos);
        yPos += (splitDescription.length * 5) + 4;
    } else {
        yPos += 4;
    }



    // Table Data
    const tableData = selectedTransactions.map(t => [
        t.date ? new Date(t.date).toLocaleDateString('pt-BR') : '-',
        t.description,
        t.requisitionNum || '-',
        t.status === 'APPROVED' ? 'Aprovado' :
            t.status === 'QUOTATION' ? 'Orçamento' :
                t.status === 'PRODUCTION' ? 'Produção' :
                    t.status === 'COMPLETED' ? 'Concluído' :
                        t.status === 'REJECTED' ? 'Reprovado' : t.status,
    ]);

    // Table Headers
    const tableHeaders = [['Data', 'Descrição', 'Nº Req.', 'Status']];

    // Generate Table
    autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: yPos + 4,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Blue header
    });

    // Save PDF
    doc.save(`solicitacao_${event.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};
