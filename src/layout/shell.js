// Small pure helpers behind the signed-in shell (sidebar, top bar, greeting).
// Kept out of the components so the rules are unit-tested, not eyeballed.

export function greetingFor(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function initialsOf(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

// The sidebar's long-standing matching rule: "/" only matches itself, every
// other item also lights up for its sub-pages.
export function isActivePath(itemPath, pathname) {
  return pathname === itemPath || (itemPath !== '/' && pathname.startsWith(itemPath));
}

const moduleOf = (path) => path.split('/')[1] || '';

// The one sidebar item that stands for the current page. The longest matching
// path wins (so /salary-slips/me lights "My Salary Slip", not both slip items).
// A sibling tab that has no item of its own (/masters/departments) falls back
// to its module's item - but only when the module has exactly one, never a guess.
export function activePath(sections, pathname) {
  const items = sections.flatMap((section) => section.items);
  const matches = items.filter((item) => isActivePath(item.path, pathname));
  if (matches.length > 0) {
    return matches.reduce((a, b) => (b.path.length > a.path.length ? b : a)).path;
  }
  const current = moduleOf(pathname);
  const sameModule = current ? items.filter((item) => moduleOf(item.path) === current) : [];
  return sameModule.length === 1 ? sameModule[0].path : null;
}

// "Section › Item" for the top bar.
export function activeTrail(sections, pathname) {
  const path = activePath(sections, pathname);
  if (!path) return null;
  const section = sections.find((s) => s.items.some((item) => item.path === path));
  const item = section.items.find((i) => i.path === path);
  return { section: section.label, item: item.label };
}
