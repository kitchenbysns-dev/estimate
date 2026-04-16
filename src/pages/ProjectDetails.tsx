import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Download, Trash2, Calculator } from 'lucide-react';
import { format } from 'date-fns';

import { store } from '../lib/store';
import { Project, Estimation } from '../types';
import { exportEstimationToPDF } from '../lib/pdf-export';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [estimations, setEstimations] = useState<Estimation[]>([]);

  useEffect(() => {
    if (id) {
      const p = store.getProjects().find(p => p.id === id);
      if (p) {
        setProject(p);
        setEstimations(store.getEstimations(id));
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  if (!project) return null;

  const handleDelete = (estId: string) => {
    if (confirm('Are you sure you want to delete this estimation?')) {
      store.deleteEstimation(estId);
      setEstimations(store.getEstimations(id));
    }
  };

  const handleExport = (est: Estimation) => {
    exportEstimationToPDF(project, est);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Projects
      </div>

      <header className="page-header">
        <div className="project-title">
          <h1>{project.name}</h1>
          <p>{project.clientName} • {project.location}</p>
        </div>
        <div className="actions">
          <Link to={`/projects/${project.id}/material-calculation`}>
            <button className="btn btn-primary">
              <Calculator className="mr-2 h-4 w-4" /> Material Calculation
            </button>
          </Link>
          <Link to={`/projects/${project.id}/new-estimation`}>
            <button className="btn btn-primary">
              <Plus className="mr-2 h-4 w-4" /> New Estimation
            </button>
          </Link>
        </div>
      </header>

      {estimations.length === 0 ? (
        <div className="theme-card" style={{ alignItems: 'center', justifyContent: 'center', height: '256px', borderStyle: 'dashed' }}>
          <FileText className="h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No estimations yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
            Create your first estimation for this project using AI and blueprints.
          </p>
          <Link to={`/projects/${project.id}/new-estimation`}>
            <button className="btn btn-primary mt-4">
              <Plus className="mr-2 h-4 w-4" /> Create Estimation
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {estimations.map(est => (
            <div key={est.id} className="theme-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ height: '48px', width: '48px', backgroundColor: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText className="h-6 w-6" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)' }}>{est.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>{format(new Date(est.createdAt), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Rs. {est.totalCost.toLocaleString()}</span>
                    <span>•</span>
                    <span className={`theme-badge ${est.status === 'Approved' ? 'theme-badge-info' : ''}`} style={{ backgroundColor: est.status === 'Approved' ? 'var(--success)' : 'var(--border)', color: est.status === 'Approved' ? 'white' : 'var(--text-muted)' }}>
                      {est.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="actions">
                <button className="btn btn-outline" onClick={() => handleExport(est)}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </button>
                <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#fca5a5' }} onClick={() => handleDelete(est.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
