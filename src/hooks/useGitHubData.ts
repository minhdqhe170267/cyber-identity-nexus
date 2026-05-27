import { useQuery } from '@tanstack/react-query';
import { GITHUB_USERNAME } from '@/config/profile';
import {
  fetchGitHubContributions,
  fetchGitHubRepos,
  fetchGitHubUser,
  filterVisibleGitHubRepos,
} from '@/lib/github';

const STALE_TIME = 10 * 60 * 1000;

export const useGitHubUser = () =>
  useQuery({
    queryKey: ['github-user', GITHUB_USERNAME],
    queryFn: ({ signal }) => fetchGitHubUser(GITHUB_USERNAME, signal),
    staleTime: STALE_TIME,
  });

export const useGitHubRepos = () =>
  useQuery({
    queryKey: ['github-repos', GITHUB_USERNAME, 'visible-public-v2'],
    queryFn: async ({ signal }) => filterVisibleGitHubRepos(await fetchGitHubRepos(GITHUB_USERNAME, signal)),
    staleTime: STALE_TIME,
  });

export const useGitHubContributions = () =>
  useQuery({
    queryKey: ['github-contributions', GITHUB_USERNAME],
    queryFn: ({ signal }) => fetchGitHubContributions(GITHUB_USERNAME, signal),
    staleTime: STALE_TIME,
  });
