import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, BorderStyle, WidthType, ShadingType, Header, Footer,
} from 'docx';

const BLUE   = '2E75B6';
const DKBLUE = '1F4E79';
const GREEN  = '375623';
const RED    = 'C00000';
const AMBER  = 'BF8F00';
const GRAY   = 'F2F2F2';
const DKGRAY = '595959';
const WHITE  = 'FFFFFF';
const LTBLUE = 'D6E4F0';

const border = (color = 'CCCCCC') => ({ style: BorderStyle.SINGLE, size: 1, color });
const allBorders = (color = 'CCCCCC') => ({
  top: border(color), bottom: border(color), left: border(color), right: border(color),
});

const scoreColor = (s: number) => s >= 70 ? GREEN : s >= 45 ? AMBER : RED;
const scoreStatus = (s: number) => s >= 70 ? '✔ Good' : s >= 45 ? '⚠ Partial' : '✘ Weak';
const scoreLabel = (s: number) => s >= 70 ? 'Strong match' : s >= 45 ? 'Needs improvement' : 'Needs significant improvement';
const progressBar = (score: number) => '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10));

const heading = (text: string) => new Paragraph({
  spacing: { before: 360, after: 120 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 4 } },
  children: [new TextRun({ text, bold: true, size: 28, color: DKBLUE, font: 'Arial' })],
});

const subheading = (text: string) => new Paragraph({
  spacing: { before: 200, after: 80 },
  children: [new TextRun({ text, bold: true, size: 22, color: DKGRAY, font: 'Arial' })],
});

const body = (text: string, opts?: { bold?: boolean; color?: string; italics?: boolean }) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({
      text,
      size: 20,
      bold: opts?.bold,
      italics: opts?.italics,
      color: opts?.color || '000000',
      font: 'Arial',
    })],
  });

const bulletItem = (text: string, color: string, symbol: string) =>
  new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: symbol + '  ', bold: true, size: 20, color, font: 'Arial' }),
      new TextRun({ text, size: 20, font: 'Arial' }),
    ],
  });

const stepHeader = (step: number, title: string) => new Paragraph({
  spacing: { before: 240, after: 80 },
  indent: { left: 0 },
  shading: { fill: LTBLUE, type: ShadingType.CLEAR },
  children: [
    new TextRun({ text: `STEP ${step} — `, bold: true, size: 22, color: BLUE, font: 'Arial' }),
    new TextRun({ text: title, bold: true, size: 22, color: DKBLUE, font: 'Arial' }),
  ],
});

const scoreRow = (label: string, score: number, weight: string) =>
  new TableRow({
    children: [
      new TableCell({
        width: { size: 3500, type: WidthType.DXA },
        borders: allBorders(),
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 18, font: 'Arial' })] })],
      }),
      new TableCell({
        width: { size: 1500, type: WidthType.DXA },
        borders: allBorders(),
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `${score}%`, bold: true, size: 18, color: scoreColor(score), font: 'Arial' })],
        })],
      }),
      new TableCell({
        width: { size: 1200, type: WidthType.DXA },
        borders: allBorders(),
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: weight, size: 18, font: 'Arial', color: DKGRAY })],
        })],
      }),
      new TableCell({
        width: { size: 2160, type: WidthType.DXA },
        borders: allBorders(),
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        shading: { fill: GRAY, type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [new TextRun({ text: scoreStatus(score), size: 18, color: scoreColor(score), font: 'Arial' })],
        })],
      }),
    ],
  });

export const generateATSReportDocx = async (
  analysis: any,
  candidateName: string,
  jobTitle: string,
  company: string
): Promise<Buffer> => {
  const rawCats = analysis.categoryScores || {};
  const catScore = (v: any): number => (v && typeof v === 'object' && 'score' in v) ? v.score : (typeof v === 'number' ? v : 0);
  const cats = {
    technicalSkills: catScore(rawCats.technicalSkills),
    keywordOptimization: catScore(rawCats.keywordOptimization),
    atsFormatting: catScore(rawCats.atsFormatting),
    experienceRelevance: catScore(rawCats.experienceRelevance),
    languageRequirements: catScore(rawCats.languageRequirements),
  };

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 20 } } },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 4 } },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: 'ATS ANALYSIS REPORT', bold: true, size: 22, color: DKBLUE, font: 'Arial' }),
              new TextRun({ text: `  |  ${candidateName}  |  ${jobTitle}, ${company}`, size: 18, color: DKGRAY, font: 'Arial' }),
            ],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
            spacing: { before: 80 },
            children: [new TextRun({ text: 'Confidential — Generated by JobAI', size: 16, color: DKGRAY, font: 'Arial' })],
          })],
        }),
      },
      children: [

        // TITLE
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          shading: { fill: DKBLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: 'ATS ANALYSIS REPORT', bold: true, size: 40, color: WHITE, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          shading: { fill: BLUE, type: ShadingType.CLEAR },
          children: [new TextRun({ text: `Candidate: ${candidateName}  |  Role: ${jobTitle}  |  ${company}`, size: 20, color: WHITE, font: 'Arial' })],
        }),

        // SECTION 1 — OVERALL SCORES
        heading('📊  OVERALL SCORES AT A GLANCE'),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: 'ATS Compatibility Score   →  ', size: 20, font: 'Arial' }),
            new TextRun({ text: `${analysis.atsScore}%`, bold: true, size: 20, color: scoreColor(analysis.atsScore), font: 'Arial' }),
            new TextRun({ text: `  (${scoreLabel(analysis.atsScore)})`, size: 20, color: DKGRAY, font: 'Arial' }),
          ],
        }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: 'Job Compatibility Score   →  ', size: 20, font: 'Arial' }),
            new TextRun({ text: `${analysis.fitScore}%`, bold: true, size: 20, color: scoreColor(analysis.fitScore), font: 'Arial' }),
            new TextRun({ text: `  (${scoreLabel(analysis.fitScore)})`, size: 20, color: DKGRAY, font: 'Arial' }),
          ],
        }),
        subheading('Score Breakdown by Category:'),
        ...[
          ['Technical Skills Match        ', cats.technicalSkills],
          ['Keyword Optimization          ', cats.keywordOptimization],
          ['ATS Formatting                ', cats.atsFormatting],
          ['Experience Relevance          ', cats.experienceRelevance],
          ['Language Requirements         ', cats.languageRequirements],
        ].map(([label, val]) => new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: `${label}${progressBar(val as number)}  ${val}%`,
            size: 20, font: 'Courier New', color: scoreColor(val as number),
          })],
        })),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 2 — SCORE TABLE
        heading('📋  DETAILED SCORE BREAKDOWN'),
        new Table({
          width: { size: 8360, type: WidthType.DXA },
          columnWidths: [3500, 1500, 1200, 2160],
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                ['Category', 3500], ['Score', 1500], ['Weight', 1200], ['Status', 2160],
              ].map(([label, width]) => new TableCell({
                width: { size: width as number, type: WidthType.DXA },
                borders: allBorders(BLUE),
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                shading: { fill: DKBLUE, type: ShadingType.CLEAR },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: label as string, bold: true, size: 20, color: WHITE, font: 'Arial' })],
                })],
              })),
            }),
            scoreRow('Technical Skills Match', cats.technicalSkills, '30%'),
            scoreRow('Keyword Optimization', cats.keywordOptimization, '25%'),
            scoreRow('ATS Formatting', cats.atsFormatting, '15%'),
            scoreRow('Experience Relevance', cats.experienceRelevance, '20%'),
            scoreRow('Language Requirements', cats.languageRequirements, '10%'),
          ],
        }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 3 — STRENGTHS
        heading('✅  WHAT WORKS IN YOUR FAVOUR'),
        ...(analysis.strengths || []).map((s: string) => bulletItem(s, GREEN, '✔')),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 4 — CRITICAL GAPS
        heading('❌  CRITICAL GAPS & MISSING KEYWORDS'),
        ...(analysis.criticalGaps || analysis.skillMatch?.missing || []).map((g: string) => bulletItem(g, RED, '✘')),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 5 — ATS FORMATTING
        heading('🤖  ATS FORMATTING ANALYSIS'),
        body('The CV has been analyzed for ATS machine-readability. Below are the key findings:', { color: DKGRAY }),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] }),
        subheading('Positives for ATS:'),
        ...(analysis.atsFormattingPositives || []).map((s: string) => bulletItem(s, GREEN, '✔')),
        new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] }),
        subheading('ATS Formatting Problems:'),
        ...(analysis.atsFormattingProblems || []).map((s: string) => bulletItem(s, RED, '✘')),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 6 — STEP BY STEP GUIDE
        heading('🛠️  STEP-BY-STEP GUIDE TO REACH 95%+ ATS SCORE'),
        body('Follow each step below. Only use skills and experiences you genuinely have.', { color: DKGRAY }),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun('')] }),
        ...(analysis.stepByStepGuide || []).flatMap((step: any) => [
          stepHeader(step.step, step.title),
          body(step.description, { color: DKGRAY }),
          ...(step.items || []).map((item: string) => new Paragraph({
            spacing: { after: 60 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: '●  ', bold: true, size: 20, color: BLUE, font: 'Arial' }),
              new TextRun({ text: item, size: 20, font: 'Arial' }),
            ],
          })),
          new Paragraph({ spacing: { after: 80 }, children: [new TextRun('')] }),
        ]),

        // SECTION 7 — PROJECTED SCORES
        heading('🎯  PROJECTED SCORE AFTER IMPROVEMENTS'),
        body('If all steps above are followed accurately and honestly:'),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({
            text: `ATS Compatibility Score       ${progressBar(analysis.projectedScores?.atsScore || 95)}  ${analysis.projectedScores?.atsScore || 95}%`,
            size: 20, font: 'Courier New', color: GREEN,
          })],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({
            text: `Job Compatibility Score       ${progressBar(analysis.projectedScores?.fitScore || 88)}  ${analysis.projectedScores?.fitScore || 88}%`,
            size: 20, font: 'Courier New', color: GREEN,
          })],
        }),
        body(analysis.projectedScores?.note || '', { italics: true, color: DKGRAY }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),

        // SECTION 8 — COVER LETTER
        ...(analysis.coverLetter ? [
          heading('✉️  COVER LETTER'),
          new Paragraph({
            spacing: { after: 120 },
            shading: { fill: LTBLUE, type: ShadingType.CLEAR },
            children: [new TextRun({ text: 'Tailored cover letter based on your background and the job post:', size: 18, italics: true, color: DKGRAY, font: 'Arial' })],
          }),
          ...analysis.coverLetter.split('\n').filter(Boolean).map((line: string) =>
            new Paragraph({
              spacing: { after: 80 },
              children: [new TextRun({ text: line, size: 20, font: 'Arial' })],
            })
          ),
          new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),
        ] : []),

        // SECTION 9 — CHECKLIST
        ...(analysis.submissionChecklist?.length ? [
          heading('📌  FINAL SUBMISSION CHECKLIST'),
          ...(analysis.submissionChecklist || []).map((item: string) => new Paragraph({
            spacing: { after: 80 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: '✘  ', bold: true, size: 20, color: RED, font: 'Arial' }),
              new TextRun({ text: item, size: 20, font: 'Arial' }),
            ],
          })),
          new Paragraph({ spacing: { after: 160 }, children: [new TextRun('')] }),
        ] : []),

        // CLOSING
        new Paragraph({
          spacing: { before: 200, after: 80 },
          border: {
            top: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 8 },
          },
          shading: { fill: LTBLUE, type: ShadingType.CLEAR },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: analysis.overallSummary || 'You have a genuine foundation. With targeted improvements, you can be a competitive candidate.',
            size: 20, italics: true, color: DKBLUE, font: 'Arial',
          })],
        }),
        new Paragraph({
          spacing: { before: 120 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: `Good luck, ${candidateName.split(' ')[0]}! 🚀`,
            bold: true, size: 24, color: DKBLUE, font: 'Arial',
          })],
        }),

      ],
    }],
  });

  return await Packer.toBuffer(doc);
};