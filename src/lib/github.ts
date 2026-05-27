import { HIDDEN_GITHUB_REPOS } from '@/config/profile';

export type GitHubUser = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  blog: string | null;
  company: string | null;
  location: string | null;
  email: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  private?: boolean;
  fork: boolean;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
};

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

const GITHUB_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

const fetchJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { headers: GITHUB_HEADERS, signal });

  if (!response.ok) {
    throw new Error(`GitHub request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchGitHubUser = (username: string, signal?: AbortSignal) =>
  fetchJson<GitHubUser>(`https://api.github.com/users/${username}`, signal);

export const fetchGitHubRepos = async (username: string, signal?: AbortSignal) => {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const pageRepos = await fetchJson<GitHubRepo[]>(
      `https://api.github.com/users/${username}/repos?type=all&sort=updated&per_page=100&page=${page}`,
      signal,
    );

    repos.push(...pageRepos);

    if (pageRepos.length < 100) break;
    page += 1;
  }

  return repos;
};

export const filterVisibleGitHubRepos = (repos: GitHubRepo[]) =>
  repos.filter((repo) => !HIDDEN_GITHUB_REPOS.includes(repo.name.toLowerCase()));

export const fetchGitHubContributions = async (username: string, signal?: AbortSignal) => {
  const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`, { signal });

  if (!response.ok) {
    return [] as ContributionDay[];
  }

  const data = await response.json();
  return (data.contributions || []) as ContributionDay[];
};

export const getDisplayName = (user?: GitHubUser | null) =>
  user?.name?.trim() || user?.login || 'minhdqhe170267';

export const getRepoStatus = (repo: GitHubRepo) => {
  if (repo.private) return 'PRIVATE';
  if (repo.archived) return 'ARCHIVED';
  if (repo.homepage?.trim()) return 'DEPLOYED';
  if (!repo.pushed_at) return 'PUBLIC';

  const lastPush = new Date(repo.pushed_at).getTime();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  return Date.now() - lastPush <= ninetyDays ? 'ACTIVE' : 'PUBLIC';
};

export const getRepoTags = (repo: GitHubRepo, limit = 5) => {
  const tags = [repo.language, ...(repo.topics || [])].filter(Boolean) as string[];
  return Array.from(new Set(tags)).slice(0, limit);
};

export const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
};
