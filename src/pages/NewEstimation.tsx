import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, File, Loader2, Save, LogIn } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../lib/store';
import { generateEstimation } from '../lib/gemini';
import { Estimation, EstimationItem, Template } from '../types';
import { useAuth } from '../lib/AuthContext';
import { signInWithGoogle } from '../lib/firebase';

export default function NewEstimation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState('New Estimation');
  const [manualInput, setManualInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<EstimationItem[] | null>(null);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    const t = store.getTemplates();
    setTemplates(t);
    if (t.length > 0) setSelectedTemplate(t[0].id);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setMimeType(f.type);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFileBase64(base64);
      };
      reader.readAsDataURL(f);
    }
  };

  const handleGenerate = async () => {
    if (!id) return;
    
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (error) {
        console.error("Sign in failed", error);
        return;
      }
    }

    setIsGenerating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const categories = template ? template.categories : ['General'];
      
      const result = await generateEstimation(fileBase64, mimeType, manualInput, categories);
      setGeneratedItems(result.items);
      setEstimatedTime(result.estimatedTimeDays);
    } catch (error) {
      console.error(error);
      alert('Failed to generate estimation. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!id || !generatedItems) return;

    const totalMaterial = generatedItems.filter(i => i.type === 'Material').reduce((sum, i) => sum + i.totalCost, 0);
    const totalLabor = generatedItems.filter(i => i.type === 'Labor').reduce((sum, i) => sum + i.totalCost, 0);
    const totalEquipment = generatedItems.filter(i => i.type === 'Equipment').reduce((sum, i) => sum + i.totalCost, 0);
    const totalCost = generatedItems.reduce((sum, i) => sum + i.totalCost, 0);

    const estimation: Estimation = {
      id: uuidv4(),
      projectId: id,
      name,
      status: 'Draft',
      items: generatedItems,
      totalMaterialCost: totalMaterial,
      totalLaborCost: totalLabor,
      totalEquipmentCost: totalEquipment,
      totalCost,
      estimatedTimeDays: estimatedTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.saveEstimation(estimation);
    navigate(`/projects/${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate(`/projects/${id}`)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Project
      </div>

      <header className="page-header">
        <div className="project-title">
          <h1>Create Estimation</h1>
          <p>Provide blueprints and manual details for the AI to analyze.</p>
        </div>
        <div className="actions">
          {generatedItems && (
            <button className="btn btn-primary" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Estimation
            </button>
          )}
        </div>
      </header>

      {!generatedItems ? (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr)' }}>
          <div className="theme-card input-panel">
            <div className="theme-card-header">
              Data Sources
              <span className="theme-badge theme-badge-info">Sync Active</span>
            </div>
            
            <div className="manual-input">
              <label>Estimation Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} />

              <label>Template</label>
              <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="upload-zone">
              <input 
                type="file" 
                accept=".pdf,image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                id="file-upload" 
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {file ? (
                  <>
                    <File className="h-10 w-10 mb-2" style={{ color: 'var(--primary)' }} />
                    <p>📄 {file.name}</p>
                    <div style={{ fontSize: '10px', marginTop: '4px', color: 'var(--text-muted)' }}>Ready for processing</div>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mb-2" style={{ color: 'var(--secondary)' }} />
                    <p>Click to select a PDF or Image blueprint</p>
                  </>
                )}
              </label>
            </div>

            <div className="manual-input">
              <label>Manual Input / Requirements</label>
              <textarea 
                placeholder="e.g. 2000 sq ft house, hardwood floors, standard fixtures..." 
                style={{ height: '120px', resize: 'vertical' }}
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleGenerate} disabled={isGenerating || (!fileBase64 && !manualInput)}>
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating with AI...</>
              ) : (
                'Generate Estimation'
              )}
            </button>
            <div style={{ marginTop: '16px', fontSize: '11px', lineHeight: 1.4, color: 'var(--text-muted)' }}>
              * AI will analyze the PDF and manual input to generate a detailed cost breakdown.
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="summary-cards">
            <div className="stat-card">
              <div className="stat-label">Estimated Total</div>
              <div className="stat-value">Rs. {generatedItems.reduce((sum, i) => sum + i.totalCost, 0).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Project Timeline</div>
              <div className="stat-value">{estimatedTime} Days</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Items Count</div>
              <div className="stat-value">{generatedItems.length} Items</div>
            </div>
          </div>

          <div className="theme-card">
            <div className="theme-card-header">Cost Breakdown</div>
            <table className="estimation-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {generatedItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.category}</td>
                    <td>{item.description}</td>
                    <td><span className="theme-badge" style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>{item.type}</span></td>
                    <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td style={{ textAlign: 'right' }}>Rs. {item.unitCost.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }} className="cost-positive">Rs. {item.totalCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
              Current Subtotal: Rs. {generatedItems.reduce((sum, i) => sum + i.totalCost, 0).toLocaleString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
