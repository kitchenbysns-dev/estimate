import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, MapPin, Calendar } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

import { store } from '../lib/store';
import { Project } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', clientName: '', location: '' });

  useEffect(() => {
    setProjects(store.getProjects());
  }, []);

  const handleCreateProject = () => {
    if (!newProject.name) return;
    
    const project: Project = {
      id: uuidv4(),
      name: newProject.name,
      clientName: newProject.clientName,
      location: newProject.location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    store.saveProject(project);
    setProjects(store.getProjects());
    setIsDialogOpen(false);
    setNewProject({ name: '', clientName: '', location: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header">
        <div className="project-title">
          <h1>Projects</h1>
          <p>Manage your building estimation projects.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="btn btn-primary">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input 
                  id="name" 
                  value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})} 
                  placeholder="e.g. Downtown Office Renovation" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client Name</Label>
                <Input 
                  id="client" 
                  value={newProject.clientName} 
                  onChange={e => setNewProject({...newProject, clientName: e.target.value})} 
                  placeholder="e.g. Acme Corp" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={newProject.location} 
                  onChange={e => setNewProject({...newProject, location: e.target.value})} 
                  placeholder="e.g. 123 Main St, City" 
                />
              </div>
            </div>
            <DialogFooter>
              <button className="btn btn-outline" onClick={() => setIsDialogOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateProject}>Create Project</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {projects.length === 0 ? (
        <div className="theme-card" style={{ alignItems: 'center', justifyContent: 'center', height: '256px', borderStyle: 'dashed' }}>
          <Folder className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No projects yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            Get started by creating a new project. You can then add estimations and generate reports.
          </p>
          <button className="btn btn-primary mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="summary-cards">
          {projects.map(project => (
            <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="theme-card" style={{ height: '100%', cursor: 'pointer' }}>
                <div className="theme-card-header" style={{ marginBottom: '8px' }}>
                  {project.name}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {project.clientName || 'No client specified'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MapPin className="mr-2 h-4 w-4" />
                    {project.location || 'No location'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
