import { TemplateProps, fullName, contactLine, linksLine, visibleSections, dateRange, Bullets } from './shared';

const ACCENT = '#2563eb';

export const ModernTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const contact = contactLine(data);
  const links = linksLine(data);

  const heading = (title: string) => (
    <div style={{ marginTop: 16, marginBottom: 8, borderLeft: `3px solid ${ACCENT}`, paddingLeft: 10 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
    </div>
  );

  const renderSection = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{heading(s.title)}<p style={{ margin: '0 0 0 13px', lineHeight: 1.5, fontSize: 10.5, color: '#374151' }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 10, paddingLeft: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11, color: '#111' }}>{e.role}</strong>
              <span style={{ fontSize: 10, color: ACCENT, fontWeight: 500 }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.company, e.location].filter(Boolean).join(' • ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5, color: '#374151' }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 10, paddingLeft: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11 }}>{e.degree}</strong>
              <span style={{ fontSize: 10, color: ACCENT }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.institution, e.location].filter(Boolean).join(' • ')}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ paddingLeft: 13 }}>{data.skills.map(sk => (
          <div key={sk.id} style={{ fontSize: 10.5, marginBottom: 3 }}><span style={{ fontWeight: 600, color: '#111' }}>{sk.category}:</span> <span style={{ color: '#374151' }}>{sk.skills}</span></div>
        ))}</div></div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 8, paddingLeft: 13 }}>
            <strong style={{ fontSize: 11 }}>{p.name}</strong>{p.subtitle && <span style={{ color: '#6b7280', fontSize: 10.5 }}> — {p.subtitle}</span>}
            <Bullets items={p.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ paddingLeft: 13, fontSize: 10.5 }}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}</div></div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ paddingLeft: 13 }}>{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10.5, marginBottom: 2 }}><strong>{c.name}</strong> — {c.issuer}{c.date && `, ${c.date}`}</div>
        ))}</div></div>;
      case 'custom':
        return <div key={s.id}>{heading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6, paddingLeft: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontSize: 11 }}>{it.title}</strong><span style={{ fontSize: 10 }}>{it.date}</span></div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#6b7280' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif', color: '#111', padding: '0', lineHeight: 1.4 }}>
      <div style={{ background: ACCENT, padding: '28px 36px', color: '#fff' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{name}</h1>
        {data.personalInfo.title && <div style={{ fontSize: 13, opacity: 0.9, marginTop: 3 }}>{data.personalInfo.title}</div>}
        {contact.length > 0 && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 6 }}>{contact.join('  •  ')}</div>}
        {links.length > 0 && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{links.join('  •  ')}</div>}
      </div>
      <div style={{ padding: '8px 36px 36px' }}>
        {visibleSections(data).map(renderSection)}
      </div>
    </div>
  );
};
