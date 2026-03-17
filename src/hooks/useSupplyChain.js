const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
import { useState } from 'react';
import { ITEMS } from '../data/commodities';

export function useSupplyChain() {
  const [curCat, setCurCat] = useState('all');
  const [curItem, setCurItem] = useState(null);
  const [curCountry, setCurCountry] = useState(null);
  const [viewMode, setViewMode] = useState('production');
  const [activeTab, setActiveTab] = useState('overview');

  const filteredItems = ITEMS.filter(
    i => curCat === 'all' || i.cat === curCat
  );

  function selectItem(id) {
    setCurItem(ITEMS.find(i => i.id === id));
    setCurCountry(null);
    setActiveTab('overview');
  }

  function selectCountry(name) {
    setCurCountry(name);
    if (activeTab === 'overview') setActiveTab('overview');
  }

  function clearCountry() {
    setCurCountry(null);
  }

  return {
    curCat, setCurCat,
    curItem,
    curCountry,
    viewMode, setViewMode,
    activeTab, setActiveTab,
    filteredItems,
    selectItem,
    selectCountry,
    clearCountry,
  };
}