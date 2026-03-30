import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { CVData } from '@/types/cv';

/* ── PDF Export (from rendered DOM) ──────────────────────── */
export const exportPDF = async (element: HTMLElement, filename: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const imgW = canvas.width;
  const imgH = canvas.height;
  const ratio = pdfW / imgW;
  const scaledH = imgH * ratio;
  const pages = Math.ceil(scaledH / pdfH);

  for (let i = 0; i < pages; i++) {
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -(i * pdfH), pdfW, scaledH);
  }

  pdf.save(`${filename}.pdf`);
};

/* ── DOCX Export (structured from data) ──────────────────── */
export const exportDOCX = async (data: CVData, filename: string) => {
  const children: Paragraph[] = [];

  const name = [data.personalInfo.firstName, data.personalInfo.lastName].filter(Boolean).join(' ') || 'Your Name';
  const contact = [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location].filter(Boolean).join('  |  ');
  const links = [data.personalInfo.linkedin, data.personalInfo.github, data.personalInfo.website].filter(Boolean).join('  |  ');

  // Header
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: name, bold: true, size: 28, font: 'Calibri' })] }));
  if (data.personalInfo.title) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: data.personalInfo.title, size: 22, color: '666666', font: 'Calibri' })] }));
  }
  if (contact) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: contact, size: 18, color: '888888', font: 'Calibri' })] }));
  }
  if (links) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: links, size: 18, color: '888888', font: 'Calibri' })] }));
  }

  // Sections
  for (const section of data.sections.filter(s => s.visible)) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 22, font: 'Calibri' })],
    }));

    switch (section.type) {
      case 'summary':
        if (data.summary) children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.summary, size: 20, font: 'Calibri' })] }));
        break;

      case 'experience':
        for (const e of data.experience) {
          const dateStr = e.current ? `${e.startDate} — Present` : [e.startDate, e.endDate].filter(Boolean).join(' — ');
          children.push(new Paragraph({ children: [
            new TextRun({ text: e.role, bold: true, size: 21, font: 'Calibri' }),
            new TextRun({ text: `    ${dateStr}`, size: 19, color: '666666', font: 'Calibri' }),
          ] }));
          children.push(new Paragraph({ children: [new TextRun({ text: [e.company, e.location].filter(Boolean).join(' | '), italics: true, size: 20, color: '555555', font: 'Calibri' })] }));
          for (const b of e.description.filter(Boolean)) {
            children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: 20, font: 'Calibri' })] }));
          }
        }
        break;

      case 'education':
        for (const e of data.education) {
          const dateStr = [e.startDate, e.endDate].filter(Boolean).join(' — ');
          children.push(new Paragraph({ children: [
            new TextRun({ text: e.degree, bold: true, size: 21, font: 'Calibri' }),
            new TextRun({ text: `    ${dateStr}`, size: 19, color: '666666', font: 'Calibri' }),
          ] }));
          const sub = [e.institution, e.location].filter(Boolean).join(' | ') + (e.gpa ? ` | GPA: ${e.gpa}` : '');
          children.push(new Paragraph({ children: [new TextRun({ text: sub, italics: true, size: 20, color: '555555', font: 'Calibri' })] }));
          for (const b of e.description.filter(Boolean)) {
            children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: 20, font: 'Calibri' })] }));
          }
        }
        break;

      case 'skills':
        for (const sk of data.skills) {
          children.push(new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: `${sk.category}: `, bold: true, size: 20, font: 'Calibri' }),
            new TextRun({ text: sk.skills, size: 20, font: 'Calibri' }),
          ] }));
        }
        break;

      case 'projects':
        for (const p of data.projects) {
          children.push(new Paragraph({ children: [
            new TextRun({ text: p.name, bold: true, size: 21, font: 'Calibri' }),
            p.subtitle ? new TextRun({ text: ` — ${p.subtitle}`, size: 20, color: '555555', font: 'Calibri' }) : new TextRun(''),
          ] }));
          for (const b of p.description.filter(Boolean)) {
            children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b, size: 20, font: 'Calibri' })] }));
          }
        }
        break;

      case 'languages':
        children.push(new Paragraph({ children: [new TextRun({ text: data.languages.map(l => `${l.language} (${l.proficiency})`).join('  •  '), size: 20, font: 'Calibri' })] }));
        break;

      case 'certifications':
        for (const c of data.certifications) {
          children.push(new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: c.name, bold: true, size: 20, font: 'Calibri' }),
            new TextRun({ text: ` — ${c.issuer}${c.date ? `, ${c.date}` : ''}`, size: 20, font: 'Calibri' }),
          ] }));
        }
        break;
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
};
