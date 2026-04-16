import { Project, Estimation, Template } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'buildestimate_projects',
  ESTIMATIONS: 'buildestimate_estimations',
  TEMPLATES: 'buildestimate_templates',
};

export const store = {
  getProjects: (): Project[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  },
  saveProject: (project: Project) => {
    const projects = store.getProjects();
    const existing = projects.findIndex(p => p.id === project.id);
    if (existing >= 0) {
      projects[existing] = project;
    } else {
      projects.push(project);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },
  deleteProject: (id: string) => {
    const projects = store.getProjects().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getEstimations: (projectId?: string): Estimation[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ESTIMATIONS);
    const estimations: Estimation[] = data ? JSON.parse(data) : [];
    if (projectId) {
      return estimations.filter(e => e.projectId === projectId);
    }
    return estimations;
  },
  getEstimation: (id: string): Estimation | undefined => {
    return store.getEstimations().find(e => e.id === id);
  },
  saveEstimation: (estimation: Estimation) => {
    const estimations = store.getEstimations();
    const existing = estimations.findIndex(e => e.id === estimation.id);
    if (existing >= 0) {
      estimations[existing] = estimation;
    } else {
      estimations.push(estimation);
    }
    localStorage.setItem(STORAGE_KEYS.ESTIMATIONS, JSON.stringify(estimations));
  },
  deleteEstimation: (id: string) => {
    const estimations = store.getEstimations().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ESTIMATIONS, JSON.stringify(estimations));
  },

  getTemplates: (): Template[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (!data) {
      // Default template
      const defaultTemplate: Template = {
        id: 'default-1',
        name: 'Standard Residential Build',
        description: 'Basic template for residential construction',
        categories: ['Foundation', 'Framing', 'Plumbing', 'Electrical', 'Roofing', 'Finishes'],
        defaultItems: []
      };
      localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify([defaultTemplate]));
      return [defaultTemplate];
    }
    return JSON.parse(data);
  },
  saveTemplate: (template: Template) => {
    const templates = store.getTemplates();
    const existing = templates.findIndex(t => t.id === template.id);
    if (existing >= 0) {
      templates[existing] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },
  deleteTemplate: (id: string) => {
    const templates = store.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  }
};
