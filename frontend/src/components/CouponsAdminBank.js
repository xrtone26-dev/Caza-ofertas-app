// Archivo: src/components/CouponsAdminBank.js
import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';

export default function CouponsAdminBank({ API, adminPassword, getSafeId, loadPublicOffers, loadPublicProducts }) {
  const [bankCoupons, setBankCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [newBankCoupon, setNewBankCoupon] = useState({
    type: 'bancario',
    banco: '',
    tipo: '',
    code: '',
    discount: '',
    min_purchase: '',
    tope: '',
    active: true,
  });

  const loadBankCoupons = async () => {
    try {
      // Consultamos tanto ofertas como productos para asegurar que detecte todos los cupones bancarios existentes
      const [offersRes, productsRes] = await Promise.all([
        axios.get(`${API}/admin/offers`, { params: { password: adminPassword, t: Date.now() } }).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/products`, { params: { password: adminPassword, t: Date.now() } }).catch(() => ({ data: [] }))
      ]);

      const combined = [
        ...(offersRes.data || []),
        ...(productsRes.data || [])
      ];

      // Filtramos los que tengan type 'bancario' o tengan definido el campo 'banco'
      const onlyBank = combined.filter(o => o.type === 'bancario' || o.banco);
      setBankCoupons(onlyBank);
    } catch (error) {
      console.error("Error al cargar cupones bancarios:", error);
    }
  };

  useEffect(() => {
    loadBankCoupons();
  }, []);

  const handleSaveCoupon = async () => {
    try {
      const couponData = {
        ...newBankCoupon,
        type: 'bancario',
        id: editingCoupon ? getSafeId(editingCoupon) : 'bank_' + Date.now(),
      };

      const couponId = editingCoupon ? getSafeId(editingCoupon) : null;

      if (editingCoupon) {
        // Intentamos actualizar en ofertas; si falla o pertenecía a productos, probamos en productos
        try {
          await axios.patch(`${API}/admin/offers/${couponId}?password=${adminPassword}`, couponData);
        } catch {
          await axios.patch(`${API}/admin/products/${couponId}?password=${adminPassword}`, couponData);
        }
      } else {
        await axios.post(`${API}/admin/offers?password=${adminPassword}`, couponData);
      }

      setShowModal(false);
      setEditingCoupon(null);
      setNewBankCoupon({
        type: 'bancario',
        banco: '',
        tipo: '',
        code: '',
        discount: '',
        min_purchase: '',
        tope: '',
        active: true,
      });
      loadBankCoupons();
      if (loadPublicOffers) loadPublicOffers();
      if (loadPublicProducts) loadPublicProducts();
    } catch (error) {
      alert('Error al guardar cupón bancario');
    }
  };

  const handleDelete = async (coupon) => {
    const couponId = getSafeId(coupon);
    if (!couponId) return;
    if (window.confirm('¿Estás seguro de eliminar este cupón bancario?')) {
      try {
        try {
          await axios.delete(`${API}/admin/offers/${couponId}?password=${adminPassword}`);
        } catch {
          await axios.delete(`${API}/admin/products/${couponId}?password=${adminPassword}`);
        }
        loadBankCoupons();
        if (loadPublicOffers) loadPublicOffers();
        if (loadPublicProducts) loadPublicProducts();
      } catch (error) {
        alert('Error al eliminar cupón bancario');
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          setEditingCoupon(null);
          setNewBankCoupon({
            type: 'bancario',
            banco: '',
            tipo: '',
            code: '',
            discount: '',
            min_purchase: '',
            tope: '',
            active: true,
          });
          setShowModal(true);
        }}
        className="mb-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg"
      >
        <Plus className="w-5 h-5" /> Nuevo Cupón Bancario
      </button>

      {bankCoupons.length === 0 ? (
        <p className="text-gray-500 italic p-4 bg-gray-50 rounded-xl border">No hay cupones bancarios registrados o sincronizados aún. Da clic en "Nuevo Cupón Bancario" para agregar uno.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bankCoupons.map((coupon) => (
            <div key={getSafeId(coupon) || coupon.code} className="border-2 rounded-xl p-6 border-blue-300 bg-blue-50/50">
              <div className="flex justify-between items-start mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-200 text-blue-900 border border-blue-400 uppercase">
                  💳 {coupon.banco || 'Banco'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCoupon(coupon);
                      setNewBankCoupon({ ...coupon });
                      setShowModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 bg-blue-100 p-1.5 rounded-lg"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="text-red-600 hover:text-red-800 bg-red-100 p-1.5 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">{coupon.discount}</h3>
              <p className="text-gray-600 text-sm font-semibold mb-2">{coupon.tipo}</p>
              <p className="text-sm text-gray-500 font-mono">
                Código: <span className="font-bold text-black uppercase">{coupon.code}</span>
              </p>
              <div className="flex justify-between text-xs text-gray-600 font-bold mt-3 pt-2 border-t border-blue-200">
                <span>Compra Mínima: {coupon.min_purchase}</span>
                <span>Tope: {coupon.tope}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 shadow-2xl relative border-t-8 border-blue-600">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black mb-4 pr-8 text-blue-600">
              {editingCoupon ? 'Editar Cupón Bancario' : 'Nuevo Cupón Bancario'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">Banco Oficial</label>
                <select
                  value={newBankCoupon.banco}
                  onChange={(e) => setNewBankCoupon({ ...newBankCoupon, banco: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 bg-white"
                >
                  <option value="">-- Selecciona el Banco --</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Banamex">Banamex</option>
                  <option value="American Express">American Express</option>
                  <option value="HSBC">HSBC</option>
                  <option value="Afirme">Afirme</option>
                  <option value="Openbank">Openbank</option>
                  <option value="Mifel">Mifel</option>
                  <option value="BBVA">BBVA</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">Tipo de Promoción (Ej. Meses sin Tarjeta)</label>
                <input
                  type="text"
                  value={newBankCoupon.tipo}
                  onChange={(e) => setNewBankCoupon({ ...newBankCoupon, tipo: e.target.value })}
                  placeholder="Ej: Tarjetas Banamex"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Código del Cupón</label>
                  <input
                    type="text"
                    value={newBankCoupon.code}
                    onChange={(e) => setNewBankCoupon({ ...newBankCoupon, code: e.target.value })}
                    placeholder="MESES99"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-sm font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Descuento (Ej. 10% OFF)</label>
                  <input
                    type="text"
                    value={newBankCoupon.discount}
                    onChange={(e) => setNewBankCoupon({ ...newBankCoupon, discount: e.target.value })}
                    placeholder="10% OFF"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-sm font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Compra Mínima</label>
                  <input
                    type="text"
                    value={newBankCoupon.min_purchase}
                    onChange={(e) => setNewBankCoupon({ ...newBankCoupon, min_purchase: e.target.value })}
                    placeholder="$2,500"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-sm">Tope de Descuento</label>
                  <input
                    type="text"
                    value={newBankCoupon.tope}
                    onChange={(e) => setNewBankCoupon({ ...newBankCoupon, tope: e.target.value })}
                    placeholder="$500"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  checked={newBankCoupon.active}
                  onChange={(e) => setNewBankCoupon({ ...newBankCoupon, active: e.target.checked })}
                  className="w-5 h-5 mr-3 accent-blue-600"
                />
                <label className="text-gray-700 font-bold text-sm">Activo (visible en el carrusel)</label>
              </div>

              <button
                onClick={handleSaveCoupon}
                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg mt-2"
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
