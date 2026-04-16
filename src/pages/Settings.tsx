import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Rate {
  id: string;
  category: string;
  name: string;
  unit: string;
  price: number;
  updatedAt: string;
  updatedBy: string;
}

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'rates'));
      const fetchedRates: Rate[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRates.push(doc.data() as Rate);
      });
      setRates(fetchedRates);
    } catch (error) {
      console.error("Error fetching rates", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRate = () => {
    const newRate: Rate = {
      id: uuidv4(),
      category: 'Material',
      name: '',
      unit: '',
      price: 0,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'Unknown'
    };
    setRates([...rates, newRate]);
  };

  const handleRateChange = (id: string, field: keyof Rate, value: any) => {
    setRates(rates.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemoveRate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate?')) return;
    try {
      await deleteDoc(doc(db, 'rates', id));
      setRates(rates.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting rate", error);
      alert("Failed to delete rate.");
    }
  };

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      for (const rate of rates) {
        if (!rate.name || !rate.unit) continue;
        const rateToSave = {
          ...rate,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.email || 'Unknown'
        };
        await setDoc(doc(db, 'rates', rate.id), rateToSave);
      }
      alert('Rates saved successfully!');
      fetchRates();
    } catch (error) {
      console.error("Error saving rates", error);
      alert("Failed to save rates.");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="theme-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header className="page-header">
        <div className="project-title">
          <h1>Settings & Rates</h1>
          <p>Manage material and labor rates for estimations.</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={handleSaveRates} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </header>

      <div className="theme-card">
        <div className="theme-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Global Rates Database</span>
          <button className="btn btn-outline" onClick={handleAddRate} style={{ padding: '4px 8px', fontSize: '13px' }}>
            <Plus className="h-4 w-4 mr-1" /> Add Rate
          </button>
        </div>
        
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>Loading rates...</div>
        ) : (
          <table className="estimation-table" style={{ marginTop: '16px' }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>Unit</th>
                <th>Price (Rs.)</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No rates configured yet. Add some rates to use in estimations.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      <select 
                        value={rate.category} 
                        onChange={(e) => handleRateChange(rate.id, 'category', e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      >
                        <option value="Material">Material</option>
                        <option value="Labor">Labor</option>
                        <option value="Equipment">Equipment</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={rate.name} 
                        onChange={(e) => handleRateChange(rate.id, 'name', e.target.value)}
                        placeholder="e.g. Cement"
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={rate.unit} 
                        onChange={(e) => handleRateChange(rate.id, 'unit', e.target.value)}
                        placeholder="e.g. Bag"
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={rate.price} 
                        onChange={(e) => handleRateChange(rate.id, 'price', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(rate.updatedAt).toLocaleDateString()} by {rate.updatedBy}
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline" 
                        style={{ color: '#ef4444', borderColor: '#fca5a5', padding: '6px' }} 
                        onClick={() => handleRemoveRate(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
