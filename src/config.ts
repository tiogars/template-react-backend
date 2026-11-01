import type { CreateTaskRequest } from '@organization_template/react-client';

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
export const docsBaseUrl = import.meta.env.VITE_DOCS_BASE_URL ?? 'http://localhost:8000';
export const githubBaseUrl = import.meta.env.VITE_GITHUB_BASE_URL ?? 'https://github.com/tiogars/template-java-solution';

export const seedRequests: CreateTaskRequest[] = [
  {
    code: 'review',
    label: 'Review requirements',
    description: 'Review the requirements with the team.',
    status: 'TODO',
    priority: 'HIGH',
  },
  {
    code: 'implement',
    label: 'Implement feature',
    description: 'Implement and test the feature.',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
  },
  {
    code: 'release',
    label: 'Prepare release',
    description: 'Prepare release notes and deployment.',
    status: 'TODO',
    priority: 'NORMAL',
  },
];
