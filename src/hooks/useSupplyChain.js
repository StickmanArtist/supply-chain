import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export function useSupplyChain() {
  const [allItems, setAllItems]     = useState([]);
  const [curCat, setCurCat]         = useState('all');
  const [curItem, setCurItem]       = useState(null);
  const [curCountry, setCurCountry] = useState(null);
  const [viewMode, setViewMode]     = useState('production');
  const [activeTab, setActiveTab]   = useState('overview');
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch(`${API}/commodities`)
      .then(r => r.json())
      .then(data => { setAllItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filteredItems = allItems.filter(
    i => curCat === 'all' || i.cat === curCat
  );

  async function selectItem(id) {
    const data = await fetch(`${API}/commodities/${id}`).then(r => r.json());
    setCurItem(data);
    setCurCountry(null);
    setActiveTab('overview');
  }

  function selectCountry(name) {
    setCurCountry(name);
  }

  function clearCountry() {
    setCurCountry(null);
  }

  return {
    allItems, filteredItems,
    curCat, setCurCat,
    curItem,
    curCountry,
    viewMode, setViewMode,
    activeTab, setActiveTab,
    loading,
    selectItem,
    selectCountry,
    clearCountry,
    API,
  };
}