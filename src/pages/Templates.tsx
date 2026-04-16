import { useState, useEffect } from 'react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../lib/store';
import { Template } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '', categories: '' });

  useEffect(() => {
    setTemplates(store.getTemplates());
  }, []);

  const handleCreateTemplate = () => {
    if (!newTemplate.name) return;
    
    const template: Template = {
      id: uuidv4(),
      name: newTemplate.name,
      description: newTemplate.description,
      categories: newTemplate.categories.split(',').map(c => c.trim()).filter(c => c),
      defaultItems: []
    };
    
    store.saveTemplate(template);
    setTemplates(store.getTemplates());
    setIsDialogOpen(false);
    setNewTemplate({ name: '', description: '', categories: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      store.deleteTemplate(id);
      setTemplates(store.getTemplates());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header">
        <div className="project-title">
          <h1>Templates</h1>
          <p>Manage estimation templates and categories.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger className="btn btn-primary">
            <Plus className="mr-2 h-4 w-4" /> New Template
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name" 
                  value={newTemplate.name} 
                  onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} 
                  placeholder="e.g. Commercial Office Build" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={newTemplate.description} 
                  onChange={e => setNewTemplate({...newTemplate, description: e.target.value})} 
                  placeholder="Brief description" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categories">Categories (comma separated)</Label>
                <Input 
                  id="categories" 
                  value={newTemplate.categories} 
                  onChange={e => setNewTemplate({...newTemplate, categories: e.target.value})} 
                  placeholder="e.g. Foundation, Framing, Electrical" 
                />
              </div>
            </div>
            <DialogFooter>
              <button className="btn btn-outline" onClick={() => setIsDialogOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateTemplate}>Create Template</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {templates.length === 0 ? (
        <div className="theme-card" style={{ alignItems: 'center', justifyContent: 'center', height: '256px', borderStyle: 'dashed' }}>
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No templates yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            Create templates to standardize your estimations and guide the AI.
          </p>
          <button className="btn btn-primary mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="summary-cards">
          {templates.map(template => (
            <div key={template.id} className="theme-card" style={{ height: '100%' }}>
              <div className="theme-card-header" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {template.name}
                <button className="btn btn-outline" style={{ padding: '4px', color: '#ef4444', borderColor: 'transparent' }} onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px', minHeight: '40px' }}>
                {template.description || 'No description provided.'}
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Categories:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {template.categories.map((cat, idx) => (
                    <span key={idx} className="theme-badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
