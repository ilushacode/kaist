export const capitalizeName = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) =>
      word
        .split('.')
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join('.')
    )
    .join(' ');
};

export const formatBuilding = (raw: string | null | undefined): string => {
  const trimmed = raw?.trim() ?? '';
  if (/^\d+$/.test(trimmed)) {
    return `Здание ${trimmed}`;
  }
  return trimmed;
};