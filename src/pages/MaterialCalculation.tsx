import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LogIn, Calculator, Loader2, ArrowLeft, Upload, File } from 'lucide-react';
import { signInWithGoogle, db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { generateMaterialCalculation } from '../lib/gemini';

export default function MaterialCalculation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [area, setArea] = useState<number | ''>('');
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

  const isValidInput = (area !== '' && Number(area) > 0) || file !== null;

  const handleCalculate = async () => {
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
      let cementBags = 0;
      let sandCuFt = 0;
      let aggregateCuFt = 0;
      let steelKg = 0;
      let bricksPcs = 0;
      let paintsLtr = 0;
      let tilesSqFt = 0;

      if (fileBase64 || manualInput) {
        // Use AI if file or manual input is provided
        const aiResult = await generateMaterialCalculation(fileBase64, mimeType, manualInput, area);
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
    } catch (error) {
      console.error(error);
      alert('Failed to calculate materials. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
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
      </header>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 1fr)' }}>
        <div className="theme-card input-panel">
          <div className="theme-card-header">
            Input Parameters
          </div>
          
          <div className="manual-input">
            <label>Total Area (sq. ft)</label>
            <input 
              type="number" 
              value={area} 
              onChange={e => setArea(e.target.value === '' ? '' : Number(e.target.value))} 
              min="1"
              placeholder="Enter area in sq. ft"
            />
          </div>

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

          <div className="manual-input" style={{ marginTop: '16px' }}>
            <label>Manual Input / Requirements</label>
            <textarea 
              placeholder="e.g. 2000 sq ft house, hardwood floors, standard fixtures..." 
              style={{ height: '100px', resize: 'vertical' }}
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
            />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={handleCalculate} disabled={loadingRates || isGenerating || !isValidInput}>
            {isGenerating || loadingRates ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isGenerating ? 'Calculating with AI...' : 'Loading Rates...'}</>
            ) : (
              <><Calculator className="mr-2 h-4 w-4" /> Calculate Materials</>
            )}
          </button>
          <div style={{ marginTop: '16px', fontSize: '11px', lineHeight: 1.4, color: 'var(--text-muted)' }}>
            * Provide a valid area OR upload a blueprint to calculate materials.
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
                  <th style={{ textAlign: 'right' }}>Quantity</th>
                  <th>Unit</th>
                  <th style={{ textAlign: 'right' }}>Total Cost (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Cement</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.cement.qty}</td>
                  <td>Bags (50kg)</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.cement.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Sand</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.sand.qty}</td>
                  <td>Cu. Ft</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.sand.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Aggregate</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.aggregate.qty}</td>
                  <td>Cu. Ft</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.aggregate.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Steel</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.steel.qty}</td>
                  <td>Kg</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.steel.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Bricks</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.bricks.qty}</td>
                  <td>Pieces</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.bricks.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Paints</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.paints.qty}</td>
                  <td>Liters</td>
                  <td style={{ textAlign: 'right' }}>Rs. {calculationResult.paints.cost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Tiles</td>
                  <td style={{ textAlign: 'right' }}>{calculationResult.tiles.qty}</td>
                  <td>Sq. Ft</td>
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
