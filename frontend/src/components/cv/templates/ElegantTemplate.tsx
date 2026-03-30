import { TemplateProps, fullName, contactLine, linksLine, visibleSections, dateRange, Bullets } from './shared';

const GOLD = '#92400e';
export const ElegantTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const contact = contactLine(data);
  const links = linksLine(data);

  const heading = (title: string) => (
    <div style={{ marginTop: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, color: GOLD, margin: 0, textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: GOLD + '40' }} />
    </div>
  );

  const renderSection = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{heading(s.title)}<p style={{ margin: 0, lineHeight: 1.6, fontSize: 10.5, color: '#4b5563', fontStyle: 'italic' }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: 11, color: '#111' }}>{e.role}</strong>
              <span style={{ fontSize: 9.5, color: GOLD, fontWeight: 500, fontStyle: 'italic' }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#78716c' }}>{[e.company, e.location].filter(Boolean).join(' — ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5, color: '#374151' }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11 }}>{e.degree}</strong>
              <span style={{ fontSize: 9.5, color: GOLD, fontStyle: 'italic' }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#78716c' }}>{[e.institution, e.location].filter(Boolean).join(' — ')}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{data.skills.map(sk => (
          <div key={sk.id} style={{ fontSize: 10.5, marginBottom: 2 }}><span style={{ fontWeight: 600, color: GOLD }}>{sk.category}:</span> {sk.skills}</div>
        ))}</div></div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 11 }}>{p.name}</strong>{p.subtitle && <span style={{ color: '#78716c', fontSize: 10.5 }}> — {p.subtitle}</span>}
            <Bullets items={p.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ fontSize: 10.5 }}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join('  •  ')}</div></div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10.5, marginBottom: 2 }}><strong>{c.name}</strong> — {c.issuer}{c.date && `, ${c.date}`}</div>
        ))}</div>;
      case 'custom':
        return <div key={s.id}>{heading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontSize: 11 }}>{it.title}</strong><span style={{ fontSize: 10, color: GOLD, fontStyle: 'italic' }}>{it.date}</span></div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#78716c' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif', color: '#1c1917', padding: '40px 44px', lineHeight: 1.4 }}>
      <div style={{ textAlign: 'center', paddingBottom: 14, borderBottom: `2px solid ${GOLD}` }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: 2, color: '#111' }}>{name}</h1>
        {data.personalInfo.title && <div style={{ fontSize: 13, color: GOLD, marginTop: 4, fontWeight: 400, fontStyle: 'italic' }}>{data.personalInfo.title}</div>}
        {contact.length > 0 && <div style={{ fontSize: 10, color: '#78716c', marginTop: 6 }}>{contact.join('   •   ')}</div>}
        {links.length > 0 && <div style={{ fontSize: 10, color: '#78716c', marginTop: 2 }}>{links.join('   •   ')}</div>}
      </div>
      {visibleSections(data).map(renderSection)}
    </div>
  );
};
