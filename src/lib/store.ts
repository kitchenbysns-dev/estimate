import { Project, Estimation, Template } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'buildestimate_projects',
  ESTIMATIONS: 'buildestimate_estimations',
  TEMPLATES: 'buildestimate_templates',
};

export const store = {
  getProjects: (): Project[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data || data === 'undefined') return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse projects from localStorage', e);
      return [];
    }
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ESTIMATIONS);
      if (!data || data === 'undefined') return [];
      const estimations: Estimation[] = JSON.parse(data);
      if (projectId) {
        return estimations.filter(e => e.projectId === projectId);
      }
      return estimations;
    } catch (e) {
      console.warn('Failed to parse estimations from localStorage', e);
      return [];
    }
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!data || data === 'undefined') {
        const defaultTemplate1: Template = {
          id: 'default-1',
          name: 'Standard Residential Build',
          description: 'Basic template for residential construction',
          categories: ['Foundation', 'Framing', 'Plumbing', 'Electrical', 'Roofing', 'Finishes'],
          defaultItems: []
        };
        const defaultTemplate2: Template = {
          id: 'default-2',
          name: 'Framed Structure Building',
          description: 'Template for framed structure building estimation',
          categories: ['Excavation', 'Concrete Work', 'Formwork', 'Reinforcement', 'Masonry', 'Plastering', 'Painting', 'Flooring'],
          defaultItems: []
        };
        const defaults = [defaultTemplate1, defaultTemplate2];
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse templates from localStorage', e);
      return [];
    }
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
