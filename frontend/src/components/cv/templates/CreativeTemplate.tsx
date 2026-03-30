import { TemplateProps, fullName, visibleSections, dateRange, Bullets } from './shared';

const TEAL = '#0d9488';
const TEAL_BG = '#f0fdfa';

export const CreativeTemplate = ({ data }: TemplateProps) => {
  const name = fullName(data);
  const p = data.personalInfo;

  // Sidebar sections: skills, languages, certifications, contact
  const sidebarTypes = new Set(['skills', 'languages', 'certifications']);
  const mainSections = visibleSections(data).filter(s => !sidebarTypes.has(s.type));
  const sidebarSections = visibleSections(data).filter(s => sidebarTypes.has(s.type));

  const sideHeading = (title: string) => (
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: TEAL, margin: '14px 0 6px', borderBottom: `1px solid ${TEAL}40`, paddingBottom: 3 }}>{title}</h3>
  );

  const mainHeading = (title: string) => (
    <div style={{ marginTop: 16, marginBottom: 8 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: TEAL, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h2>
      <div style={{ width: 40, height: 2, background: TEAL, marginTop: 3 }} />
    </div>
  );

  const renderMain = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'summary':
        if (!data.summary) return null;
        return <div key={s.id}>{mainHeading(s.title)}<p style={{ margin: 0, lineHeight: 1.5, fontSize: 10.5, color: '#374151' }}>{data.summary}</p></div>;
      case 'experience':
        if (!data.experience.length) return null;
        return <div key={s.id}>{mainHeading(s.title)}{data.experience.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11 }}>{e.role}</strong>
              <span style={{ fontSize: 10, color: TEAL, fontWeight: 500 }}>{dateRange(e.startDate, e.endDate, e.current)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.company, e.location].filter(Boolean).join(' • ')}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'education':
        if (!data.education.length) return null;
        return <div key={s.id}>{mainHeading(s.title)}{data.education.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 11 }}>{e.degree}</strong>
              <span style={{ fontSize: 10, color: TEAL }}>{dateRange(e.startDate, e.endDate)}</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#6b7280' }}>{[e.institution, e.location].filter(Boolean).join(' • ')}{e.gpa ? ` | GPA: ${e.gpa}` : ''}</div>
            <Bullets items={e.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'projects':
        if (!data.projects.length) return null;
        return <div key={s.id}>{mainHeading(s.title)}{data.projects.map(pr => (
          <div key={pr.id} style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 11 }}>{pr.name}</strong>{pr.subtitle && <span style={{ color: '#6b7280', fontSize: 10.5 }}> — {pr.subtitle}</span>}
            <Bullets items={pr.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      case 'custom':
        return <div key={s.id}>{mainHeading(s.title)}{(data.customSections[s.id] || []).map(it => (
          <div key={it.id} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ fontSize: 11 }}>{it.title}</strong><span style={{ fontSize: 10 }}>{it.date}</span></div>
            {it.subtitle && <div style={{ fontSize: 10.5, color: '#6b7280' }}>{it.subtitle}</div>}
            <Bullets items={it.description} style={{ fontSize: 10.5 }} />
          </div>
        ))}</div>;
      default: return null;
    }
  };

  const renderSidebar = (s: typeof data.sections[0]) => {
    switch (s.type) {
      case 'skills':
        if (!data.skills.length) return null;
        return <div key={s.id}>{sideHeading(s.title)}{data.skills.map(sk => (
          <div key={sk.id} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#111' }}>{sk.category}</div>
            <div style={{ fontSize: 9.5, color: '#4b5563', lineHeight: 1.4 }}>{sk.skills}</div>
          </div>
        ))}</div>;
      case 'languages':
        if (!data.languages.length) return null;
        return <div key={s.id}>{sideHeading(s.title)}{data.languages.map(l => (
          <div key={l.id} style={{ fontSize: 10, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
            <span>{l.language}</span><span style={{ color: '#6b7280' }}>{l.proficiency}</span>
          </div>
        ))}</div>;
      case 'certifications':
        if (!data.certifications.length) return null;
        return <div key={s.id}>{sideHeading(s.title)}{data.certifications.map(c => (
          <div key={c.id} style={{ fontSize: 10, marginBottom: 4 }}>
            <div style={{ fontWeight: 600 }}>{c.name}</div>
            <div style={{ color: '#6b7280' }}>{c.issuer}{c.date && ` • ${c.date}`}</div>
          </div>
        ))}</div>;
      default: return null;
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, "Helvetica Neue", sans-serif', display: 'flex', minHeight: '100%', lineHeight: 1.4 }}>
      {/* Sidebar */}
      <div style={{ width: '32%', background: TEAL_BG, padding: '32px 20px', borderRight: `3px solid ${TEAL}` }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: TEAL, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700 }}>
          {(p.firstName?.[0] || '') + (p.lastName?.[0] || '') || '?'}
        </div>
        {sideHeading('Contact')}
        {p.email && <div style={{ fontSize: 9.5, marginBottom: 4, wordBreak: 'break-all' }}>{p.email}</div>}
        {p.phone && <div style={{ fontSize: 9.5, marginBottom: 4 }}>{p.phone}</div>}
        {p.location && <div style={{ fontSize: 9.5, marginBottom: 4 }}>{p.location}</div>}
        {p.linkedin && <div style={{ fontSize: 9.5, marginBottom: 4, wordBreak: 'break-all' }}>{p.linkedin}</div>}
        {p.github && <div style={{ fontSize: 9.5, marginBottom: 4, wordBreak: 'break-all' }}>{p.github}</div>}
        {p.website && <div style={{ fontSize: 9.5, marginBottom: 4, wordBreak: 'break-all' }}>{p.website}</div>}
        {sidebarSections.map(renderSidebar)}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: '32px 28px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111', margin: 0 }}>{name}</h1>
        {p.title && <div style={{ fontSize: 13, color: TEAL, fontWeight: 500, marginTop: 2 }}>{p.title}</div>}
        {mainSections.map(renderMain)}
      </div>
    </div>
  );
};
