import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { decodeCoupon } from './CouponsAdmin';

export default function OffersAdmin({ API, adminPassword, getSafeId, loadPublicOffers }) {
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [newOffer, setNewOffer] = useState({
    type: 'descuento',
    title: '',
    description: '',
    link: '',
    expires_at: '',
    active: true,
  });

  const loadOffers = async () => {
    try {
      const response = await axios.get(`${API}/admin/offers`, {
        params: { password: adminPassword },
      });
      // Filtramos únicamente los que son de tipo descuento
      const onlyOffers = response.data.map(decodeCoupon).filter(o => o.type === 'descuento');
      setOffers(onlyOffers);
    } catch (error) {
      console.error("--- ⚠️ Error al cargar ofertas: ---", error);
    }
  };

  React.useEffect(() => {
    loadOffers();
  }, []);

  const handleSaveOffer = async () => {
    try {
      let desc = (newOffer.description || '').replace(/\s*\|\|exp:.*?\|\|/g, '');
      if (newOffer.expires_at) desc += ` ||exp:${newOffer.expires_at}||`;

      const offerData = {
        ...newOffer,
        description: desc,
        type: 'descuento',
        id: editingOffer ? getSafeId(editingOffer) : 'offer_' + Date.now(),
      };

      if (editingOffer) {
        const offerId = getSafeId(editingOffer);
        await axios.patch(`${API}/admin/offers/${offerId}?password=${adminPassword}`, offerData);
      } else {
        await axios.post(`${API}/admin/offers?password=${adminPassword}`, offerData);
      }

      setShowModal(false);
      setEditingOffer(null);
      setNewOffer({
        type: 'descuento',
        title: '',
        description: '',
        link: '',
        expires_at: '',
        active: true,
      });
      loadOffers();
      if (loadPublicOffers) loadPublicOffers();
    } catch (error) {
      console.error("Error guardando oferta:", error);
      alert('Error al guardar oferta');
    }
  };

  const handleDelete = async (offer) => {
    const offerId = getSafeId(offer);
    if (!offerId) return;
    if (window.confirm('¿Estás seguro de eliminar esta oferta?')) {
      try {
        await axios.delete(`${API}/admin/offers/${offerId}?password=${adminPassword}`);
        loadOffers();
        if (loadPublicOffers) loadPublicOffers();
      } catch (error) {
        console.error("Error eliminando oferta:", error);
        alert('Error al eliminar oferta');
      }
    }
  };

  return (
    <div>
      <button
        onClick={() => { setEditingOffer(null); setShowModal(true); }}
        className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Nueva Oferta
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => (
          <div key={getSafeId(offer) || offer.title} className="border-2 rounded-xl p-6 border-blue-300 bg-blue-50">
            <div className="flex justify-between items-start mb-3">
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-200 text-blue-800">🏷️ Oferta</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingOffer(offer);
                    setNewOffer(offer);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button onClick={() => handleDelete(offer)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
            <p className="text-gray-600 mb-2">{offer.description}</p>
            {offer.expires_at && <p className="text-xs text-red-500 mt-1 font-bold">⏰ Expira: {new Date(offer.expires_at).toLocaleString()}</p>}
            {offer.link && <p className="text-sm text-blue-600 truncate mt-1">Link: {offer.link}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-500 hover:text-gray-800">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">{editingOffer ? 'Editar Oferta' : 'Agregar Oferta'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">Título</label>
                <input
                  type="text"
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                  placeholder="Ej: Rebajas de temporada"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Descripción</label>
                <textarea
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                  placeholder="Detalles de la oferta"
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Fecha y Hora de Expiración</label>
                <input
                  type="datetime-local"
                  value={newOffer.expires_at}
                  onChange={(e) => setNewOffer({ ...newOffer, expires_at: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">Enlace / Link</label>
                <input
                  type="text"
                  value={newOffer.link}
                  onChange={(e) => setNewOffer({ ...newOffer, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleSaveOffer}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {editingOffer ? 'Actualizar Oferta' : 'Guardar Oferta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
