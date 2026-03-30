import { TemplateProps, fullName, contactLine, linksLine, visibleSections, dateRange, Bullets } from './shared';

const NAVY = '#1e3a5f';

export const ProfessionalTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const contact = contactLine(data);
  const links = linksLine(data);

  const heading = (title: string) => (
    <div style={{ marginTop: 16, marginBottom: 8, borderBottom: `2px solid ${NAVY}`, paddingBottom: 3 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: NAVY, margin: 0, textTransform: 'uppercase' }}>{title}</h2>
    </div>
  );

  const renderSection = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{heading(s.title)}<p style={{ margin: 0, lineHeight: 1.5, fontSize: 10.5 }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11, color: NAVY }}>{e.role}</strong>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#555' }}>{[e.company, e.location].filter(Boolean).join(' | ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11, color: NAVY }}>{e.degree}</strong>
              <span style={{ fontSize: 10 }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, fontStyle: 'italic', color: '#555' }}>{[e.institution, e.location].filter(Boolean).join(' | ')}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.skills.map(sk => (
          <div key={sk.id} style={{ fontSize: 10.5, marginBottom: 3 }}><strong style={{ color: NAVY }}>{sk.category}:</strong> {sk.skills}</div>
        ))}</div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 11, color: NAVY }}>{p.name}</strong>{p.subtitle && <span style={{ fontSize: 10.5, color: '#555' }}> — {p.subtitle}</span>}
            <Bullets items={p.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ fontSize: 10.5 }}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join('  |  ')}</div></div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10.5, marginBottom: 2 }}><strong>{c.name}</strong> — {c.issuer}{c.date && `, ${c.date}`}</div>
        ))}</div>;
      case 'custom':
        return <div key={s.id}>{heading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontSize: 11, color: NAVY }}>{it.title}</strong><span style={{ fontSize: 10 }}>{it.date}</span></div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#555', fontStyle: 'italic' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif', color: '#222', padding: 0, lineHeight: 1.4 }}>
      <div style={{ background: NAVY, padding: '24px 36px', color: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 1 }}>{name}</h1>
        {data.personalInfo.title && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3, fontWeight: 300 }}>{data.personalInfo.title}</div>}
      </div>
      <div style={{ background: '#f1f5f9', padding: '8px 36px', fontSize: 10, color: '#475569', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {[...contact, ...links].map((c, i) => <span key={i}>{c}</span>)}
      </div>
      <div style={{ padding: '8px 36px 36px' }}>
        {visibleSections(data).map(renderSection)}
      </div>
    </div>
  );
};
