import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2 } from 'lucide-react';
import { store } from '../lib/store';
import { Project, Estimation, EstimationItem } from '../types';
import { exportEstimationToPDF } from '../lib/pdf-export';

export default function ViewEstimation() {
  const { id, estId } = useParams<{ id: string, estId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [items, setItems] = useState<EstimationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id, estId]);

  const fetchData = async () => {
    if (!id || !estId) return;
    try {
      // Fetch project
      const p = store.getProjects().find(p => p.id === id);
      if (p) setProject(p);

      // Fetch estimation
      const est = store.getEstimation(estId);
      if (est) {
        setEstimation(est);
        setItems(est.items || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!project || !estimation) return;
    exportEstimationToPDF(project, { ...estimation, items });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!id || !estId || !estimation) return;
    if (window.confirm('Are you sure you want to delete this item?')) {
      const newItems = items.filter(item => item.id !== itemId);
      setItems(newItems);
      
      // Update local storage estimation
      const updatedEstimation = {
        ...estimation,
        items: newItems,
        totalCost: newItems.reduce((sum, i) => sum + i.totalCost, 0),
        totalMaterialCost: newItems.filter(i => i.type === 'Material').reduce((sum, i) => sum + i.totalCost, 0),
        totalLaborCost: newItems.filter(i => i.type === 'Labor').reduce((sum, i) => sum + i.totalCost, 0),
        totalEquipmentCost: newItems.filter(i => i.type === 'Equipment').reduce((sum, i) => sum + i.totalCost, 0),
      };
      
      store.saveEstimation(updatedEstimation);
      setEstimation(updatedEstimation);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Loading estimation details...</div>;
  }

  if (!project || !estimation) {
    return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Estimation not found.</div>;
  }

  const currentTotal = items.reduce((sum, item) => sum + item.totalCost, 0);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '24px' }}>
        <button className="btn btn-outline" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
        </button>
      </div>

      <header className="page-header">
        <div className="project-title">
          <h1>{estimation.name}</h1>
          <p>Estimation Details</p>
        </div>
        <div className="actions">
          <button className="btn btn-outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      <div className="summary-cards">
        <div className="stat-card">
          <div className="stat-label">Estimated Total</div>
          <div className="stat-value">Rs. {currentTotal.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Project Timeline</div>
          <div className="stat-value">{estimation.estimatedTimeDays} Days</div>
        </div>
        {estimation.totalArea && (
          <div className="stat-card">
            <div className="stat-label">Total Area</div>
            <div className="stat-value">{estimation.totalArea}</div>
          </div>
        )}
        {estimation.totalFloors && (
          <div className="stat-card">
            <div className="stat-label">Total Floors</div>
            <div className="stat-value">{estimation.totalFloors}</div>
          </div>
        )}
      </div>

      <div className="theme-card">
        <div className="theme-card-header">Cost Breakdown</div>
        <table className="estimation-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Rate (Rs.)</th>
              <th style={{ textAlign: 'right' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Line Total</th>
              <th style={{ width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.category}</td>
                <td>{item.description}</td>
                <td>{item.unit}</td>
                <td style={{ textAlign: 'right' }}>{item.unitCost.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }} className="cost-positive">Rs. {item.totalCost.toLocaleString()}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                    title="Delete Item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fde68a' }}>
            ✦ This estimation is generated using AI. Please Contact with us for detailed and accurate estimation.
          </div>
          <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
            Current Subtotal: Rs. {currentTotal.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
