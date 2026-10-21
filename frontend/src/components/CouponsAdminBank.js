// src/components/BankCouponsAdmin.jsx

import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, Clock, DollarSign, ExternalLink, ShieldCheck, Building2 } from 'lucide-react';
import axios from 'axios';

const getFutureDate30Hours = () => {
  const d = new Date(Date.now() + 30 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getBankInfo = (title = '') => {
  // Corrección: Asegurar que title sea una cadena válida para evitar errores si es null o undefined
  const t = String(title || '').toLowerCase();
  if (t.includes('bbva')) {
    return { name: 'BBVA', bg: 'bg-[#004481]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/BBVA_2019.svg' };
  } else if (t.includes('santander')) {
    return { name: 'SANTANDER', bg: 'bg-[#EC0000]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Banco_Santander_Logotipo.svg' };
  } else if (t.includes('banorte')) {
    return { name: 'BANORTE', bg: 'bg-[#EB0029]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Banorte_logo.svg' };
  } else if (t.includes('citibanamex') || t.includes('banamex')) {
    return { name: 'CITIBANAMEX', bg: 'bg-[#001E62]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Citibanamex_logo.svg' };
  } else if (t.includes('hsbc')) {
    return { name: 'HSBC', bg: 'bg-[#DB0011]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/aa/HSBC_logo_%282018%29.svg' };
  } else if (t.includes('nu')) {
    return { name: 'NU', bg: 'bg-[#820AD1]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nu_logo.svg' };
  } else if (t.includes('amex') || t.includes('american express')) {
    return { name: 'AMEX', bg: 'bg-[#006FCF]', text: 'text-white', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg' };
  }
  return { name: 'BANCO', bg: 'bg-blue-600', text: 'text-white', logo: null };
};

export const decodeCoupon = (offer) => {
  let expires_at = offer.expires_at;
  let description = offer.description || '';
  const match = description.match(/\|\|exp:(.*?)\|\|/);
  if (match) {
    if (match[1]) expires_at = match[1];
    description = description.replace(match[0], '').trim();
  }
  
  if (!expires_at) {
    expires_at = getFutureDate30Hours();
  } else {
    try {
      const d = new Date(expires_at);
      if (!isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        expires_at = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } else {
        expires_at = getFutureDate30Hours();
      }
    } catch (e) {
      expires_at = getFutureDate30Hours();
    }
  }

  return { ...offer, expires_at, description };
};

export default function BankCouponsAdmin({ API, adminPassword, getSafeId, loadPublicOffers }) {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [newCoupon, setNewCoupon] = useState({
    type: 'bancario',
    title: '',
    description: '',
    code: '',
    min_purchase: '',
    link: '',
    expires_at: getFutureDate30Hours(),
    active: true,
  });

  const formatCurrencyInput = (value) => {
    const rawDigits = value.replace(/\D/g, '');
    if (!rawDigits) return '';
    return '$' + Number(rawDigits).toLocaleString('en-US');
  };

  const loadCoupons = async () => {
    try {
      const response = await axios.get(`${API}/admin/offers`, {
        params: { password: adminPassword },
      });
      const bankCoupons = response.data.map(decodeCoupon).filter(o => o.type === 'bancario');
      setCoupons(bankCoupons);
    } catch (error) {}
  };

  React.useEffect(() => {
    loadCoupons();
  }, []);

  const handleSaveCoupon = async () => {
    try {
      const rawMin = newCoupon.min_purchase ? Number(String(newCoupon.min_purchase).replace(/\D/g, '')) : 0;
      let desc = (newCoupon.description || '').replace(/\s*\|\|exp:.*?\|\|/g, '');
      
      const finalExpiresAt = newCoupon.expires_at || getFutureDate30Hours();
      desc += ` ||exp:${finalExpiresAt}||`;

      const couponData = {
        ...newCoupon,
        description: desc,
        expires_at: finalExpiresAt,
        min_purchase: rawMin,
        type: 'bancario',
        id: editingCoupon ? getSafeId(editingCoupon) : 'banco_' + Date.now(),
      };

      if (editingCoupon) {
        const couponId = getSafeId(editingCoupon);
        await axios.patch(`${API}/admin/offers/${couponId}?password=${adminPassword}`, couponData);
      } else {
        await axios.post(`${API}/admin/offers?password=${adminPassword}`, couponData);
      }

      setShowModal(false);
      setEditingCoupon(null);
      setNewCoupon({
        type: 'bancario',
        title: '',
        description: '',
        code: '',
        min_purchase: '',
        link: '',
        expires_at: getFutureDate30Hours(),
        active: true,
      });
      loadCoupons();
      if (loadPublicOffers) loadPublicOffers();
    } catch (error) {
      alert('Error al guardar cupón bancario');
    }
  };

  const handleDelete = async (coupon) => {
    const couponId = getSafeId(coupon);
    if (!couponId) return;
    if (window.confirm('¿Estás seguro de eliminar este cupón bancario?')) {
      try {
        await axios.delete(`${API}/admin/offers/${couponId}?password=${adminPassword}`);
        loadCoupons();
        if (loadPublicOffers) loadPublicOffers();
      } catch (error) {
        alert('Error al eliminar cupón bancario');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 text-white">
      <button
        onClick={() => { 
          setEditingCoupon(null); 
          setNewCoupon({
            type: 'bancario',
            title: '',
            description: '',
            code: '',
            min_purchase: '',
            link: '',
            expires_at: getFutureDate30Hours(),
            active: true,
          });
          setShowModal(true); 
        }}
        className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Nuevo Cupón Bancario
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coupons.map((coupon) => {
          const couponId = getSafeId(coupon) || coupon.title;
          const bank = getBankInfo(coupon.title);

          return (
            <div
              key={couponId}
              className={`relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border-2 ${
                coupon.active ? 'border-blue-500/50 shadow-blue-500/10' : 'border-neutral-700 opacity-60'
              } shadow-xl overflow-hidden p-5 transition-all hover:border-blue-400`}
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> CUPÓN BANCARIO
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${coupon.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {coupon.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setNewCoupon({
                        ...coupon,
                        type: 'bancario',
                        min_purchase: coupon.min_purchase ? formatCurrencyInput(String(coupon.min_purchase)) : '',
                        expires_at: coupon.expires_at || getFutureDate30Hours()
                      });
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Logo del Banco */}
                <div className="bg-white rounded-xl p-3 text-center flex flex-col justify-center items-center h-28 border-2 border-black/10 shadow-inner">
                  {bank.logo ? (
                    <img 
                      src={bank.logo} 
                      alt={bank.name} 
                      className="w-full h-14 object-contain mb-1" 
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-blue-600 mb-1" />
                  )}
                  <span className="font-black text-[10px] uppercase tracking-widest text-slate-800 text-center">
                    {bank.name}
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <h3 className="text-lg font-black text-white tracking-wide">{coupon.title}</h3>
                  <p className="text-xs text-neutral-300 line-clamp-2">{coupon.description}</p>
                  
                  <div className="flex flex-wrap gap-3 pt-1 text-xs font-semibold">
                    {coupon.min_purchase !== undefined && coupon.min_purchase !== null && coupon.min_purchase !== 0 && (
                      <span className="text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-800/40">
                        <DollarSign className="w-3.5 h-3.5" /> Mín: ${Number(coupon.min_purchase).toLocaleString('en-US')}
                      </span>
                    )}
                    {coupon.expires_at && (
                      <span className="text-orange-400 flex items-center gap-1 bg-orange-950/40 px-2.5 py-1 rounded-md border border-orange-800/40">
                        <Clock className="w-3.5 h-3.5" /> Expira: {new Date(coupon.expires_at).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Código:</span>
                    <span className="text-sm font-black text-blue-300 tracking-wider font-mono">{coupon.code || 'SIN CÓDIGO'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-white relative shadow-2xl">
            <button 
              onClick={() => setShowModal(false)} 
              className="absolute top-6 right-6 text-neutral-400 hover:text-white p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black mb-6 text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> {editingCoupon ? 'Editar Cupón Bancario' : 'Nuevo Cupón Bancario'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Banco / Título (Ej: BBVA 15% Descuento)</label>
                <input
                  type="text"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  placeholder="Ej: BBVA Descuento Especial"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Descripción / Beneficios</label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="Detalles y meses sin intereses"
                  rows="3"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Código o Prefijo</label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  placeholder="Ej: BBVA2026"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm uppercase font-bold"
                />
              </div>
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Mínimo de Compra ($)</label>
                <input
                  type="text"
                  value={newCoupon.min_purchase}
                  onChange={(e) => setNewCoupon({ ...newCoupon, min_purchase: formatCurrencyInput(e.target.value) })}
                  placeholder="$1,000"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Fecha y Hora de Expiración</label>
                <input
                  type="datetime-local"
                  value={newCoupon.expires_at}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-neutral-300 text-xs font-bold mb-1 uppercase tracking-wider">Enlace / Link</label>
                <input
                  type="text"
                  value={newCoupon.link}
                  onChange={(e) => setNewCoupon({ ...newCoupon, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 rounded-xl focus:outline-none focus:border-blue-400 text-white text-sm"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="activeBankCoupon"
                  checked={newCoupon.active}
                  onChange={(e) => setNewCoupon({ ...newCoupon, active: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
                />
                <label htmlFor="activeBankCoupon" className="text-sm font-bold text-neutral-300 cursor-pointer">Cupón Activo</label>
              </div>
              <button
                onClick={handleSaveCoupon}
                className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3.5 rounded-xl font-black uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 transition-all"
              >
                {editingCoupon ? 'Actualizar Cupón Bancario' : 'Guardar Cupón Bancario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
