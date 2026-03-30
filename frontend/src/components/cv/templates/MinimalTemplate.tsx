import { TemplateProps, fullName, contactLine, linksLine, visibleSections, dateRange, Bullets } from './shared';

export const MinimalTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const contact = contactLine(data);
  const links = linksLine(data);

  const heading = (title: string) => (
    <div style={{ marginTop: 18, marginBottom: 8 }}>
      <h2 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, color: '#9ca3af', margin: 0 }}>{title}</h2>
      <div style={{ borderBottom: '1px solid #e5e7eb', marginTop: 4 }} />
    </div>
  );

  const renderSection = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{heading(s.title)}<p style={{ margin: 0, lineHeight: 1.6, fontSize: 10.5, color: '#4b5563' }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#111' }}>{e.role}</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.company, e.location].filter(Boolean).join(', ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5, color: '#374151' }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>{e.degree}</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.institution, e.location].filter(Boolean).join(', ')}{e.gpa ? ` — GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.skills.map(sk => (
          <div key={sk.id} style={{ fontSize: 10.5, marginBottom: 3, color: '#374151' }}><span style={{ fontWeight: 600 }}>{sk.category}:</span> {sk.skills}</div>
        ))}</div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{p.name}</span>{p.subtitle && <span style={{ color: '#9ca3af', fontSize: 10.5 }}> — {p.subtitle}</span>}
            <Bullets items={p.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ fontSize: 10.5, color: '#4b5563' }}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join('  •  ')}</div></div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10.5, color: '#374151', marginBottom: 2 }}>{c.name} — {c.issuer}{c.date && `, ${c.date}`}</div>
        ))}</div>;
      case 'custom':
        return <div key={s.id}>{heading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 600, fontSize: 11 }}>{it.title}</span><span style={{ fontSize: 10, color: '#9ca3af' }}>{it.date}</span></div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#6b7280' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', color: '#111', padding: '44px 44px', lineHeight: 1.4 }}>
      <h1 style={{ fontSize: 28, fontWeight: 300, margin: 0, letterSpacing: -0.5 }}>{name}</h1>
      {data.personalInfo.title && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2, fontWeight: 400 }}>{data.personalInfo.title}</div>}
      {contact.length > 0 && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>{contact.join('  •  ')}</div>}
      {links.length > 0 && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{links.join('  •  ')}</div>}
      {visibleSections(data).map(renderSection)}
    </div>
  );
};
