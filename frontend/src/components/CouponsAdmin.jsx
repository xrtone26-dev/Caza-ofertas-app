import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

export const decodeCoupon = (offer) => {
  let expires_at = offer.expires_at;
  let description = offer.description || '';
  const match = description.match(/\|\|exp:(.*?)\|\|/);
  if (match) {
    if (match[1]) expires_at = match[1];
    description = description.replace(match[0], '').trim();
  }
  return { ...offer, expires_at, description };
};

const getFutureDate30Hours = () => {
  const d = new Date(Date.now() + 30 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return getFutureDate30Hours();
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return getFutureDate30Hours();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function CouponsAdmin({ API, adminPassword, getSafeId, loadPublicOffers }) {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [newCoupon, setNewCoupon] = useState({
    type: 'cupon',
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
      const onlyCoupons = response.data.map(decodeCoupon).filter(o => o.type === 'cupon');
      setCoupons(onlyCoupons);
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
        type: 'cupon',
        id: editingCoupon ? getSafeId(editingCoupon) : 'offer_' + Date.now(),
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
        type: 'cupon',
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
      alert('Error al guardar cupón');
    }
  };

  const handleDelete = async (coupon) => {
    const couponId = getSafeId(coupon);
    if (!couponId) return;
    if (window.confirm('¿Estás seguro de eliminar este cupón?')) {
      try {
        await axios.delete(`${API}/admin/offers/${couponId}?password=${adminPassword}`);
        loadCoupons();
        if (loadPublicOffers) loadPublicOffers();
      } catch (error) {
        alert('Error al eliminar cupón');
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => { 
          setEditingCoupon(null); 
          setNewCoupon({
            type: 'cupon',
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
        className="mb-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Nuevo Cupón
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coupons.map((coupon) => (
          <div key={getSafeId(coupon) || coupon.title} className={`border-2 rounded-xl p-6 ${coupon.active ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
            <div className="flex justify-between items-start mb-3">
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-200 text-purple-800">✨ Cupón</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setNewCoupon({
                      ...coupon,
                      min_purchase: coupon.min_purchase ? formatCurrencyInput(String(coupon.min_purchase)) : '',
                      expires_at: formatDateTimeLocal(coupon.expires_at)
                    });
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(coupon)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{coupon.title}</h3>
            <p className="text-gray-600 mb-2">{coupon.description}</p>
            {coupon.code && <p className="text-sm text-gray-500">Código: <span className="font-bold">{coupon.code}</span></p>}
            {coupon.min_purchase !== undefined && coupon.min_purchase !== null && (
              <p className="text-sm text-purple-700 font-bold mt-1">Mínimo de compra: ${Number(coupon.min_purchase).toLocaleString('en-US')}</p>
            )}
            {coupon.expires_at && <p className="text-xs text-red-500 mt-1 font-bold">⏰ Expira: {new Date(coupon.expires_at).toLocaleString()}</p>}
            {coupon.link && <p className="text-sm text-blue-600 truncate mt-1">Link: {coupon.link}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{editingCoupon ? 'Editar Cupón' : 'Agregar Cupón'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Título</label>
                <input
                  type="text"
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  placeholder="Ej: Descuento especial"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Descripción</label>
                <textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="Detalles del cupón"
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Código</label>
                <input
                  type="text"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  placeholder="Ej: AHORRO50"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Mínimo de Compra ($)</label>
                <input
                  type="text"
                  value={newCoupon.min_purchase}
                  onChange={(e) => setNewCoupon({ ...newCoupon, min_purchase: formatCurrencyInput(e.target.value) })}
                  placeholder="$1,000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Fecha y Hora de Expiración (30 hrs por defecto)</label>
                <input
                  type="datetime-local"
                  value={newCoupon.expires_at}
                  onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Enlace / Link</label>
                <input
                  type="text"
                  value={newCoupon.link}
                  onChange={(e) => setNewCoupon({ ...newCoupon, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleSaveCoupon}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {editingCoupon ? 'Actualizar Cupón' : 'Guardar Cupón'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
