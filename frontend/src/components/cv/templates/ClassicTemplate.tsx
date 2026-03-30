import { TemplateProps, fullName, contactLine, linksLine, visibleSections, dateRange, Bullets } from './shared';

export const ClassicTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const contact = contactLine(data);
  const links = linksLine(data);

  const heading = (title: string) => (
    <div style={{ borderBottom: '1.5px solid #000', marginBottom: 6, paddingBottom: 2, marginTop: 14 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: 0, fontFamily: 'Georgia, serif' }}>{title}</h2>
    </div>
  );

  const renderSection = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{heading(s.title)}<p style={{ margin: '4px 0', lineHeight: 1.5, fontSize: 10.5 }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: 11 }}>{e.role}</strong>
              <span style={{ fontSize: 10, color: '#444' }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#333' }}>{[e.company, e.location].filter(Boolean).join(' — ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong style={{ fontSize: 11 }}>{e.degree}</strong>
              <span style={{ fontSize: 10, color: '#444' }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#333' }}>{[e.institution, e.location].filter(Boolean).join(' — ')}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.skills.map(sk => (
          <div key={sk.id} style={{ fontSize: 10.5, marginBottom: 2 }}><strong>{sk.category}:</strong> {sk.skills}</div>
        ))}</div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.projects.map(p => (
          <div key={p.id} style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 11 }}>{p.name}</strong>{p.subtitle && <span style={{ fontSize: 10.5, color: '#555' }}> — {p.subtitle}</span>}
            <Bullets items={p.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{heading(s.title)}<div style={{ fontSize: 10.5 }}>{data.languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}</div></div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{heading(s.title)}{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10.5, marginBottom: 2 }}><strong>{c.name}</strong> — {c.issuer}{c.date && `, ${c.date}`}</div>
        ))}</div>;
      case 'custom':
        return <div key={s.id}>{heading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11 }}>{it.title}</strong>
              <span style={{ fontSize: 10 }}>{it.date}</span>
            </div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#555' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', color: '#000', padding: '36px 40px', lineHeight: 1.4 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{name}</h1>
        {data.personalInfo.title && <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>{data.personalInfo.title}</div>}
        {contact.length > 0 && <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>{contact.join('  |  ')}</div>}
        {links.length > 0 && <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{links.join('  |  ')}</div>}
      </div>
      {visibleSections(data).map(renderSection)}
    </div>
  );
};
