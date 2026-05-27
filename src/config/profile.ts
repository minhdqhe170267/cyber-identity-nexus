export const GITHUB_USERNAME =
  import.meta.env.VITE_GITHUB_USERNAME?.trim() || 'minhdqhe170267';

export const CONTACT_EMAIL =
  import.meta.env.VITE_CONTACT_EMAIL?.trim() || 'dquangminh79@gmail.com';

export const CONTACT_PHONE =
  import.meta.env.VITE_CONTACT_PHONE?.trim() || '0974938780';

export const CONTACT_LOCATION =
  import.meta.env.VITE_CONTACT_LOCATION?.trim() || 'H\u00e0 N\u1ed9i, Vi\u1ec7t Nam';

export const PROFILE_ROLE =
  import.meta.env.VITE_PROFILE_ROLE?.trim() || 'Full-stack Developer';

export const PROFILE_SUMMARY =
  import.meta.env.VITE_PROFILE_SUMMARY?.trim() ||
  'I build practical web applications, admin dashboards, and API-backed systems with React, TypeScript, Java, and modern tooling. This portfolio is connected to my GitHub so projects, languages, and activity stay synced with my public repositories.';

export const PROFILE_FOCUS = (
  import.meta.env.VITE_PROFILE_FOCUS?.trim() ||
  'React + TypeScript,Java backend APIs,Admin dashboards,Portfolio tooling'
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const LINKEDIN_URL =
  import.meta.env.VITE_LINKEDIN_URL?.trim() || '';

export const X_URL =
  import.meta.env.VITE_X_URL?.trim() || '';

export const HIDDEN_GITHUB_REPOS = (
  import.meta.env.VITE_HIDDEN_GITHUB_REPOS?.trim() || 'g3,swp391_project'
)
  .split(',')
  .map((repo) => repo.trim().toLowerCase())
  .filter(Boolean);

export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_USERNAME}`;
