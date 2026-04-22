import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, Loader2, ArrowLeft, Upload, File, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { generateMaterialCalculation } from '../lib/gemini';
import { store } from '../lib/store';
import { Estimation, EstimationItem } from '../types';

export default function MaterialCalculation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [area, setArea] = useState<number | ''>('');
  const [measurementSystem, setMeasurementSystem] = useState<'Imperial (Sq.ft)' | 'Metric (Sq.m)'>('Imperial (Sq.ft)');
  const [drawingMode, setDrawingMode] = useState<'' | 'With Drawing' | 'Without Drawing'>('');
  const [manualInput, setManualInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [rates, setRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'rates'));
      const fetchedRates: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRates.push(doc.data());
      });
      setRates(fetchedRates);
    } catch (error) {
      console.error("Error fetching rates", error);
    } finally {
      setLoadingRates(false);
    }
  };

  const getRatePrice = (name: string, defaultPrice: number) => {
    const rate = rates.find(r => r.name.toLowerCase() === name.toLowerCase());
    return rate ? rate.price : defaultPrice;
  };

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

  const isValidInput = 
    drawingMode !== '' && (
      (drawingMode === 'With Drawing' && file !== null) || 
      (drawingMode === 'Without Drawing' && ((area !== '' && Number(area) > 0) || manualInput.trim() !== ''))
    );

  const handleCalculate = async () => {
    setIsGenerating(true);
    try {
      let cementBags = 0;
      let sandCuFt = 0;
      let aggregateCuFt = 0;
      let steelKg = 0;
      let bricksPcs = 0;
      let paintsLtr = 0;
      let tilesSqFt = 0;

      if (fileBase64 || manualInput) {
        // Use AI if file or manual input is provided
        const aiResult = await generateMaterialCalculation(fileBase64, mimeType, manualInput, area, measurementSystem);
        cementBags = aiResult.cement;
        sandCuFt = aiResult.sand;
        aggregateCuFt = aiResult.aggregate;
        steelKg = aiResult.steel;
        bricksPcs = aiResult.bricks;
        paintsLtr = aiResult.paints;
        tilesSqFt = aiResult.tiles;
      } else {
        // Basic mock calculation for demonstration
        const numArea = Number(area) || 1000;
        cementBags = Math.ceil(numArea * 0.4);
        sandCuFt = Math.ceil(numArea * 1.2);
        aggregateCuFt = Math.ceil(numArea * 1.5);
        steelKg = Math.ceil(numArea * 3.5);
        bricksPcs = Math.ceil(numArea * 10);
        paintsLtr = Math.ceil(numArea * 0.15);
        tilesSqFt = Math.ceil(numArea * 0.8);
      }

      const cementPrice = getRatePrice('Cement', 800);
      const sandPrice = getRatePrice('Sand', 100);
      const aggregatePrice = getRatePrice('Aggregate', 120);
      const steelPrice = getRatePrice('Steel', 110);
      const bricksPrice = getRatePrice('Bricks', 15);
      const paintsPrice = getRatePrice('Paints', 500);
      const tilesPrice = getRatePrice('Tiles', 80);

      setCalculationResult({
        cement: { qty: cementBags, cost: cementBags * cementPrice },
        sand: { qty: sandCuFt, cost: sandCuFt * sandPrice },
        aggregate: { qty: aggregateCuFt, cost: aggregateCuFt * aggregatePrice },
        steel: { qty: steelKg, cost: steelKg * steelPrice },
        bricks: { qty: bricksPcs, cost: bricksPcs * bricksPrice },
        paints: { qty: paintsLtr, cost: paintsLtr * paintsPrice },
        tiles: { qty: tilesSqFt, cost: tilesSqFt * tilesPrice },
        totalCost: (cementBags * cementPrice) + (sandCuFt * sandPrice) + (aggregateCuFt * aggregatePrice) + (steelKg * steelPrice) + (bricksPcs * bricksPrice) + (paintsLtr * paintsPrice) + (tilesSqFt * tilesPrice)
      });
    } catch (error: any) {
      console.error(error);
      if (error.message === 'MISSING_API_KEY') {
        alert('Missing Gemini API Key. Please add VITE_GEMINI_API_KEY to your environment variables in Vercel/Netlify.');
      } else {
        alert(`Failed to calculate materials: ${error.message || 'Check console for details.'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!id || !calculationResult) return;

    const targetAreaUnit = measurementSystem === 'Imperial (Sq.ft)' ? 'sq.ft' : 'sq.m';

    const materials = [
      { key: 'cement', desc: 'Cement', unit: 'Bags (50kg)' },
      { key: 'sand', desc: 'Sand', unit: 'Cu. Ft' },
      { key: 'aggregate', desc: 'Aggregate', unit: 'Cu. Ft' },
      { key: 'steel', desc: 'Steel', unit: 'Kg' },
      { key: 'bricks', desc: 'Bricks', unit: 'Pieces' },
      { key: 'paints', desc: 'Paints', unit: 'Liters' },
      { key: 'tiles', desc: 'Tiles', unit: targetAreaUnit },
    ];

    const items: EstimationItem[] = materials.map(mat => {
      const data = calculationResult[mat.key];
      return {
        id: uuidv4(),
        category: 'Materials',
        description: mat.desc,
        quantity: data.qty,
        unit: mat.unit,
        unitCost: data.qty ? data.cost / data.qty : 0,
        totalCost: data.cost,
        type: 'Material'
      };
    }).filter(item => item.quantity > 0);

    const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    const estimation: Estimation = {
      id: uuidv4(),
      projectId: id,
      name: `Material Calculation${area ? ` (${area} sq ft)` : ''}`,
      status: 'Draft',
      items,
      totalMaterialCost: totalCost,
      totalLaborCost: 0,
      totalEquipmentCost: 0,
      totalCost,
      estimatedTimeDays: 0,
      totalArea: area === '' ? undefined : area,
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
          <h1>Material Calculation</h1>
          <p>Calculate required materials based on area, blueprints, and current rates.</p>
        </div>
        <div className="actions">
          {calculationResult && (
            <button className="btn btn-primary" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save as Estimation
            </button>
          )}
        </div>
      </header>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)' }}>
        <div className="theme-card input-panel">
          <div className="theme-card-header">
            Input Parameters
          </div>
          
          <div className="manual-input">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label>Input Method</label>
                <select value={drawingMode} onChange={e => setDrawingMode(e.target.value as any)}>
                  <option value="" disabled>Select Input Method...</option>
                  <option value="With Drawing">With Drawing</option>
                  <option value="Without Drawing">Without Drawing</option>
                </select>
              </div>
              {drawingMode === 'With Drawing' && (
                <div>
                  <label>Measurement System</label>
                  <select value={measurementSystem} onChange={e => setMeasurementSystem(e.target.value as any)}>
                    <option value="Imperial (Sq.ft)">Imperial (Sq.ft)</option>
                    <option value="Metric (Sq.m)">Metric (Sq.m)</option>
                  </select>
                </div>
              )}
            </div>
            
            {drawingMode === 'Without Drawing' && (
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label>Total Area</label>
                    <input 
                      type="number" 
                      value={area} 
                      onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))} 
                      min="1"
                      placeholder={measurementSystem === 'Imperial (Sq.ft)' ? 'e.g. 2000' : 'e.g. 185'}
                    />
                  </div>
                  <div>
                    <label>Measurement System</label>
                    <select value={measurementSystem} onChange={e => setMeasurementSystem(e.target.value as any)}>
                      <option value="Imperial (Sq.ft)">Imperial (Sq.ft)</option>
                      <option value="Metric (Sq.m)">Metric (Sq.m)</option>
                    </select>
                  </div>
               </div>
            )}
          </div>

          {drawingMode === 'With Drawing' && (
            <div className="upload-zone" style={{ marginTop: '16px' }}>
              <input 
                type="file" 
                accept=".pdf,image/*" 
                onChange={handleFileChange} 
                className="hidden" 
                id="file-upload-mat" 
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload-mat" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
          )}
          
          {drawingMode === 'Without Drawing' && (
            <div className="manual-input" style={{ marginTop: '16px' }}>
              <label>Manual Input / Requirements</label>
              <textarea 
                placeholder="e.g. 2000 sq ft house, hardwood floors, standard fixtures..." 
                style={{ height: '100px', resize: 'vertical' }}
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
              />
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleCalculate} disabled={loadingRates || isGenerating || !isValidInput}>
            {isGenerating || loadingRates ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isGenerating ? 'Calculating with AI...' : 'Loading Rates...'}</>
            ) : (
              <><Calculator className="mr-2 h-4 w-4" /> Calculate Materials</>
            )}
          </button>
          <div style={{ marginTop: '16px', fontSize: '11px', lineHeight: 1.4, color: 'var(--text-muted)' }}>
            * Select an input method to provide parameters and calculate materials.
          </div>
        </div>

        {calculationResult && (
          <div className="theme-card">
            <div className="theme-card-header">
              Estimated Materials & Cost
            </div>
            <table className="estimation-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Total Cost (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Cement</td>
                  <td>Bags (50kg)</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.cement.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.cement.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Sand</td>
                  <td>Cu. Ft</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.sand.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.sand.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Aggregate</td>
                  <td>Cu. Ft</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.aggregate.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.aggregate.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Steel</td>
                  <td>Kg</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.steel.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.steel.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Bricks</td>
                  <td>Pieces</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.bricks.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.bricks.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Paints</td>
                  <td>Liters</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.paints.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.paints.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Tiles</td>
                  <td>{measurementSystem === 'Imperial (Sq.ft)' ? 'sq.ft' : 'sq.m'}</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.tiles.qty}</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.tiles.cost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '18px' }}>
              Total Estimated Cost: Rs. {calculationResult.totalCost.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
