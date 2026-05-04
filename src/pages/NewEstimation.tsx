import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, File, Loader2, Save, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { store } from '../lib/store';
import { generateEstimation } from '../lib/gemini';
import { Estimation, EstimationItem, Template } from '../types';

export default function NewEstimation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [name, setName] = useState('New Estimation');
  const [manualInput, setManualInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
  const [totalArea, setTotalArea] = useState<number | ''>('');
  const [totalFloors, setTotalFloors] = useState<number | ''>('');
  const [measurementSystem, setMeasurementSystem] = useState<'Imperial (Sq.ft)' | 'Metric (Sq.m)'>('Imperial (Sq.ft)');
  
  const [drawingMode, setDrawingMode] = useState<'' | 'With Drawing' | 'Without Drawing'>('');
  
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

  const isGenerateDisabled = 
    isGenerating || 
    drawingMode === '' || 
    !name.trim() || 
    (drawingMode === 'With Drawing' && !fileBase64) || 
    (drawingMode === 'Without Drawing' && (!totalArea || !totalFloors || !manualInput.trim()));

  const handleGenerate = async () => {
    if (!id) return;

    setIsGenerating(true);
    try {
      const template = templates.find(t => t.id === selectedTemplate);
      const categories = template ? template.categories : ['General'];
      
      const result = await generateEstimation(fileBase64, mimeType, manualInput, categories, measurementSystem);
      setGeneratedItems(result.items);
      setEstimatedTime(result.estimatedTimeDays);
    } catch (error: any) {
      console.error(error);
      if (error.message === 'MISSING_API_KEY') {
        alert('Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your environment variables in Vercel/Netlify.');
      } else if (error.message?.includes('429') || error.message?.toLowerCase().includes('quota')) {
        alert('API Quota Exceeded: You have reached the free tier limit for the AI model (15 requests per minute or 1,500 per day). Please wait a minute and try again, or upgrade your API key billing tier.');
      } else {
        alert(`Failed to generate estimation: ${error.message || 'Check console for details.'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (generatedItems) {
      setGeneratedItems(generatedItems.filter(item => item.id !== itemId));
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
      totalArea: totalArea === '' ? undefined : totalArea,
      totalFloors: totalFloors === '' ? undefined : totalFloors,
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

              <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <label>Input Method</label>
                <select value={drawingMode} onChange={e => setDrawingMode(e.target.value as any)}>
                  <option value="" disabled>Select Input Method...</option>
                  <option value="With Drawing">With Drawing</option>
                  <option value="Without Drawing">Without Drawing</option>
                </select>
              </div>

              {drawingMode === 'With Drawing' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label>Measurement System</label>
                      <select value={measurementSystem} onChange={e => setMeasurementSystem(e.target.value as any)}>
                        <option value="Imperial (Sq.ft)">Imperial (Sq.ft)</option>
                        <option value="Metric (Sq.m)">Metric (Sq.m)</option>
                      </select>
                    </div>
                    <div>
                      <label>Template</label>
                      <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
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
                </>
              )}

              {drawingMode === 'Without Drawing' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label>Total Area</label>
                      <input type="number" min="0" value={totalArea} onChange={e => setTotalArea(e.target.value === '' ? '' : Number(e.target.value))} placeholder={measurementSystem === 'Imperial (Sq.ft)' ? 'e.g. 2000' : 'e.g. 185'} />
                    </div>
                    <div>
                      <label>Total Floors</label>
                      <input type="number" min="1" value={totalFloors} onChange={e => setTotalFloors(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 2" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label>Measurement System</label>
                      <select value={measurementSystem} onChange={e => setMeasurementSystem(e.target.value as any)}>
                        <option value="Imperial (Sq.ft)">Imperial (Sq.ft)</option>
                        <option value="Metric (Sq.m)">Metric (Sq.m)</option>
                      </select>
                    </div>
                    <div>
                      <label>Template</label>
                      <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)}>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="manual-input" style={{ marginBottom: '16px' }}>
                    <label>Manual Input / Requirements</label>
                    <textarea 
                      placeholder="e.g. 2000 sq ft house, hardwood floors, standard fixtures..." 
                      style={{ height: '120px', resize: 'vertical' }}
                      value={manualInput}
                      onChange={e => setManualInput(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px' }} 
              onClick={handleGenerate} 
              disabled={isGenerateDisabled}
            >
              {isGenerating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating with AI...</>
              ) : (
                'Generate Estimation'
              )}
            </button>
            <div style={{ marginTop: '16px', fontSize: '11px', lineHeight: 1.4, color: 'var(--text-muted)' }}>
              * AI will analyze the {drawingMode === 'With Drawing' ? 'PDF/Image' : 'manual input'} to generate a detailed cost breakdown.
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
            {totalArea !== '' && (
              <div className="stat-card">
                <div className="stat-label">Total Area</div>
                <div className="stat-value">{totalArea} {measurementSystem === 'Imperial (Sq.ft)' ? 'sq.ft' : 'sq.m'}</div>
              </div>
            )}
            {totalFloors !== '' && (
              <div className="stat-card">
                <div className="stat-label">Total Floors</div>
                <div className="stat-value">{totalFloors}</div>
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
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {generatedItems.map((item) => (
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
                Current Subtotal: Rs. {generatedItems.reduce((sum, i) => sum + i.totalCost, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
