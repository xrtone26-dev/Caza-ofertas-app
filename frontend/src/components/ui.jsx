// src/components/ui.jsx
// Piezas de interfaz compartidas (solo presentación: no consultan ni transforman datos).
import React, { useEffect, useRef } from 'react';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Heart,
  Search,
  ThumbsUp,
  X,
} from 'lucide-react';

const ML_LOGO = 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.19.1/mercadolibre/logo__large_plus.png';
const ML_LOGO_FALLBACK = 'https://http2.mlstatic.com/storage/mshops-client-resource/mshops/common/images/logo-ml.png';

export const formatMoney = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(n)) return null;
  return `$${n.toLocaleString('es-MX', { maximumFractionDigits: 2 })}`;
};

// Cierra con Escape y bloquea el scroll del fondo mientras el diálogo está abierto.
export function useDialogBehavior(open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);
}

// ==========================================
// ENCABEZADO DE SECCIÓN
// ==========================================
export function SectionHeader({ id, icon, title, subtitle, isLight, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5 sm:mb-6 px-1 sm:px-2">
      <div className="min-w-0">
        <h2
          id={id}
          className={`text-xl sm:text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2 ${
            isLight ? 'text-gray-900' : 'text-neutral-100'
          }`}
        >
          {icon && <span aria-hidden="true">{icon}</span>}
          <span>{title}</span>
        </h2>
        {subtitle && (
          <p className={`mt-1 text-sm leading-snug max-w-2xl ${isLight ? 'text-gray-600' : 'text-neutral-400'}`}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ==========================================
// CAMPO DE MONTO (cupones por presupuesto)
// ==========================================
export function AmountSearchInput({ id, label, helper, value, onChange, onClear, isLight, placeholder = 'Ej. $1,500' }) {
  return (
    <div className="max-w-xl mx-auto mb-6 px-1 sm:px-2">
      <label htmlFor={id} className={`block text-sm font-black mb-1.5 ${isLight ? 'text-gray-800' : 'text-neutral-200'}`}>
        {label}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-neutral-500'}`}
        />
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-describedby={helper ? `${id}-help` : undefined}
          className={`w-full min-h-[48px] pl-12 pr-12 py-3 rounded-2xl border-2 focus:outline-none focus:border-yellow-400 text-base font-semibold ${
            isLight ? 'bg-gray-50 border-gray-300 text-gray-800' : 'bg-neutral-950 border-neutral-700 text-neutral-100'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Borrar monto"
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center ${
              isLight ? 'text-gray-500 hover:bg-gray-200' : 'text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      {helper && (
        <p id={`${id}-help`} className={`mt-1.5 text-xs ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>
          {helper}
        </p>
      )}
    </div>
  );
}

// ==========================================
// FLECHAS DE CARRUSEL
// ==========================================
export function CarouselArrows({ onPrev, onNext, label, topClass = 'top-1/2' }) {
  const base = `absolute ${topClass} -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-gray-700 border border-gray-200 shadow-lg flex items-center justify-center hover:text-[#3483FA] transition-colors`;
  return (
    <>
      <button type="button" onClick={onPrev} aria-label={`${label} anterior`} className={`${base} left-0 sm:-left-2`}>
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button type="button" onClick={onNext} aria-label={`${label} siguiente`} className={`${base} right-0 sm:-right-2`}>
        <ChevronRight className="w-6 h-6" />
      </button>
    </>
  );
}

export function SwipeHint({ count, noun, isLight }) {
  if (!count || count < 2) return null;
  return (
    <p className={`text-center text-xs font-bold mt-1 ${isLight ? 'text-gray-500' : 'text-neutral-400'}`}>
      {count} {noun} · desliza o usa las flechas para ver más
    </p>
  );
}

// ==========================================
// TARJETA DE CUPÓN (Mercado Libre y bancarios)
// ==========================================
const maskCode = (code, fallback) => {
  if (!code) return fallback;
  const str = String(code);
  return str.length > 3 ? `${str.slice(0, 3)}••••` : str;
};

export function CouponCard({ cupon, variant = 'ml', bank, gradientClass, expiryBadge, reaction, counts, onReact, onCopy }) {
  const isBank = variant === 'bank';
  const textTone = isBank ? 'text-white' : 'text-black';
  const softBg = isBank ? 'bg-black/25 border-white/30' : 'bg-white/55 border-black/20';

  const minPurchase = formatMoney(cupon.min_purchase);
  const maxDiscount = formatMoney(cupon.max_discount);
  const conditions = [];
  if (minPurchase && Number(cupon.min_purchase) > 0) conditions.push(`Compra mínima: ${minPurchase}`);
  if (maxDiscount && Number(cupon.max_discount) > 0) conditions.push(`Descuento máximo: ${maxDiscount}`);

  const title = cupon.title || (isBank ? 'Promoción bancaria' : 'Cupón de descuento');
  const brandName = isBank ? bank?.name || 'Banco' : 'Mercado Libre';

  return (
    <article
      aria-label={`${title} — ${brandName}`}
      className="h-full rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-2xl flex flex-col sm:flex-row"
    >
      {/* Marca */}
      <div className="bg-white text-gray-900 px-4 py-3 sm:p-5 flex sm:flex-col items-center sm:justify-center gap-3 sm:w-44 xl:w-52 shrink-0 border-b-2 sm:border-b-0 sm:border-r-2 border-dashed border-slate-300">
        <div
          className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-2 border-black overflow-hidden p-1.5 sm:p-2 shrink-0 ${
            isBank ? 'bg-white' : 'bg-yellow-400'
          }`}
        >
          {isBank ? (
            bank?.logo ? (
              <img src={bank.logo} alt="" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <Building2 className="w-7 h-7 text-blue-600" aria-hidden="true" />
            )
          ) : (
            <img
              src={ML_LOGO}
              alt=""
              className="w-full h-full object-contain"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = ML_LOGO_FALLBACK;
              }}
            />
          )}
        </div>
        <div className="flex flex-col sm:items-center min-w-0">
          <span className="font-black text-sm uppercase tracking-wide text-slate-900 truncate">{brandName}</span>
          <span className="text-xs font-bold text-blue-600">{isBank ? 'Promoción con tarjeta' : 'Cupón de descuento'}</span>
        </div>
      </div>

      {/* Detalle */}
      <div className={`flex-1 min-w-0 bg-gradient-to-br ${gradientClass} ${textTone} p-4 sm:p-5 flex flex-col gap-3`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-black leading-tight line-clamp-2">{title}</h3>
          <div className="shrink-0">{expiryBadge}</div>
        </div>

        {(conditions.length > 0 || cupon.description) && (
          <ul className={`text-xs sm:text-sm font-bold leading-snug space-y-0.5 ${isBank ? 'text-white/95' : 'text-black/85'}`}>
            {conditions.map((c) => (
              <li key={c}>• {c}</li>
            ))}
            {cupon.description && <li className="line-clamp-2 font-semibold">{cupon.description}</li>}
          </ul>
        )}

        {cupon.code && (
          <div className={`rounded-2xl border-2 border-dashed px-3 py-2 flex items-center justify-between gap-2 ${softBg}`}>
            <div className="min-w-0">
              <span className="block text-[11px] font-black uppercase tracking-wider opacity-80">Código</span>
              <span className="block font-mono font-black text-lg tracking-widest truncate">{maskCode(cupon.code)}</span>
            </div>
            <span className="text-[11px] font-bold opacity-90 text-right leading-tight">Se muestra completo<br />al copiarlo</span>
          </div>
        )}

        <button
          type="button"
          onClick={onCopy}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 bg-[#16803f] hover:bg-[#126a35] active:scale-[0.98] text-white font-black text-sm py-3 px-4 rounded-2xl border-2 border-black shadow-md transition"
        >
          {cupon.code ? <Copy className="w-5 h-5 shrink-0" aria-hidden="true" /> : <ExternalLink className="w-5 h-5 shrink-0" aria-hidden="true" />}
          <span>{cupon.code ? 'Copiar código y usarlo' : 'Ver promoción'}</span>
        </button>

        <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: isBank ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' }}>
          <span className="text-xs font-bold">¿Te funcionó?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onReact('like')}
              aria-pressed={reaction === 'like'}
              aria-label={`Me funcionó (${counts.like})`}
              className={`min-h-[40px] min-w-[52px] px-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 border-2 transition ${
                reaction === 'like'
                  ? 'bg-black text-white border-black'
                  : isBank
                  ? 'bg-black/25 text-white border-white/30'
                  : 'bg-white/60 text-black border-black/20'
              }`}
            >
              <ThumbsUp className="w-4 h-4" aria-hidden="true" /> {counts.like}
            </button>
            <button
              type="button"
              onClick={() => onReact('heart')}
              aria-pressed={reaction === 'heart'}
              aria-label={`Me encanta (${counts.heart})`}
              className={`min-h-[40px] min-w-[52px] px-3 rounded-xl text-sm font-black flex items-center justify-center gap-1.5 border-2 transition ${
                reaction === 'heart'
                  ? 'bg-pink-600 text-white border-pink-700'
                  : isBank
                  ? 'bg-black/25 text-white border-white/30'
                  : 'bg-white/60 text-black border-black/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${reaction === 'heart' ? 'fill-current' : ''}`} aria-hidden="true" /> {counts.heart}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ==========================================
// DIÁLOGO "CÓDIGO COPIADO" + PASOS PARA USARLO
// ==========================================
export function CouponCopyDialog({ coupon, copyStatus, onClose, onRetryCopy, fallbackLink }) {
  useDialogBehavior(Boolean(coupon), onClose);
  if (!coupon) return null;
  const link = coupon.link || fallbackLink;
  const copied = copyStatus === 'copied';

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#FFEA00] text-black border-4 border-black rounded-t-3xl sm:rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-5 sm:p-6 max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 id="copy-dialog-title" className="text-xl font-black leading-tight flex items-center gap-2">
            {coupon.code ? (
              copied ? (
                <>
                  <Check className="w-6 h-6" aria-hidden="true" /> ¡Código copiado!
                </>
              ) : (
                'Copia tu código'
              )
            ) : (
              'Cómo aprovechar esta promoción'
            )}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 shrink-0 rounded-full bg-white border-2 border-black flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {coupon.code && (
          <div className="bg-white border-2 border-dashed border-black rounded-2xl p-3 mb-4 flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-black/60">Tu código</span>
            <span className="font-mono font-black text-2xl tracking-wider text-center break-all select-all">{coupon.code}</span>
            <button
              type="button"
              onClick={onRetryCopy}
              className="min-h-[44px] px-3 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center gap-1.5"
            >
              <Copy className="w-4 h-4" aria-hidden="true" /> {copied ? 'Copiar otra vez' : 'Copiar'}
            </button>
          </div>
        )}
        {coupon.code && copyStatus === 'failed' && (
          <p className="text-sm font-bold mb-3">Tu navegador no permitió copiarlo automáticamente: mantén presionado el código para copiarlo.</p>
        )}

        <ol className="space-y-2 text-sm font-bold mb-5">
          <li className="flex gap-2"><span className="w-6 h-6 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-xs">1</span>Abre la oferta en Mercado Libre con el botón de abajo.</li>
          {coupon.code ? (
            <li className="flex gap-2"><span className="w-6 h-6 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>Antes de pagar, busca “Agregar cupón” y pega el código.</li>
          ) : (
            <li className="flex gap-2"><span className="w-6 h-6 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-xs">2</span>Paga con la tarjeta participante para recibir el beneficio.</li>
          )}
          <li className="flex gap-2"><span className="w-6 h-6 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-xs">3</span>Revisa que el descuento aparezca en el total antes de confirmar.</li>
        </ol>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="w-full min-h-[52px] inline-flex items-center justify-center gap-2 bg-[#3483fa] hover:bg-[#2968c8] text-white font-black text-base rounded-2xl border-2 border-black"
        >
          Ir a Mercado Libre <ExternalLink className="w-5 h-5" aria-hidden="true" />
        </a>
        <p className="mt-3 text-xs font-semibold text-black/70 text-center">
          La vigencia y disponibilidad dependen de Mercado Libre y pueden agotarse.
        </p>
      </div>
    </div>
  );
}
