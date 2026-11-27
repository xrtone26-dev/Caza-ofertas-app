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

// Solo presentación: extrae del texto ya existente el beneficio principal (%, monto o MSI) para destacarlo.
const getBenefitBadge = (cupon) => {
  const text = `${cupon.title || ''} ${cupon.description || ''}`;
  const msi = text.match(/(\d{1,2})\s*(?:MSI|meses sin intereses)/i);
  if (msi) return Number(msi[1]) === 1 ? '1 mes sin intereses' : `${msi[1]} meses sin intereses`;
  const pct = text.match(/(\d{1,3})\s*%/);
  if (pct) return `${pct[1]}% OFF`;
  const amt = text.match(/\$\s?([\d.,]+)/);
  if (amt) return `$${amt[1]} de descuento`;
  return null;
};

export function CouponCard({ cupon, variant = 'ml', bank, gradientClass, expiryBadge, reaction, counts, onReact, onCopy, isLight = true }) {
  const isBank = variant === 'bank';
  const minPurchase = formatMoney(cupon.min_purchase);
  const maxDiscount = formatMoney(cupon.max_discount);
  const conditions = [];
  if (minPurchase && Number(cupon.min_purchase) > 0) conditions.push(`Compra mínima: ${minPurchase}`);
  if (maxDiscount && Number(cupon.max_discount) > 0) conditions.push(`Descuento máximo: ${maxDiscount}`);

  const title = cupon.title || (isBank ? 'Promoción bancaria' : 'Cupón de descuento');
  const brandName = isBank ? bank?.name || 'Banco' : 'Mercado Libre';
  const benefit = getBenefitBadge(cupon);

  const t = isLight
    ? {
        card: 'bg-white border-[#E6E6E6] hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
        title: 'text-[#333333]',
        muted: 'text-[#666666]',
        line: 'border-[#E6E6E6]',
        box: 'bg-[#F5F5F5] border-[#E6E6E6]',
        logo: 'bg-white border-[#E6E6E6]',
        link: 'text-[#2968C8]',
        green: 'text-[#00783a] bg-[#E8F5EE]',
        react: 'bg-white border-[#E6E6E6] text-[#333333] hover:border-[#3483FA]',
        like: 'bg-[#E3EDFB] border-[#3483FA] text-[#1f55a8]',
        heart: 'bg-[#FDEBF0] border-[#E0457B] text-[#B3265A]',
      }
    : {
        card: 'bg-neutral-900 border-neutral-700 hover:shadow-lg',
        title: 'text-neutral-50',
        muted: 'text-neutral-400',
        line: 'border-neutral-700',
        box: 'bg-neutral-800 border-neutral-700',
        logo: 'bg-white border-neutral-600',
        link: 'text-[#8dbdff]',
        green: 'text-[#3ddc84] bg-[#3ddc84]/10',
        react: 'bg-neutral-800 border-neutral-700 text-neutral-100 hover:border-[#8dbdff]',
        like: 'bg-[#3483FA]/20 border-[#8dbdff] text-[#cfe3ff]',
        heart: 'bg-pink-500/15 border-pink-400 text-pink-200',
      };

  return (
    <article
      aria-label={`${title} — ${brandName}`}
      className={`h-full rounded-lg overflow-hidden border flex flex-col transition-shadow ${t.card}`}
    >
      {/* Marca + vigencia */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <div className={`w-12 h-12 rounded-full border flex items-center justify-center overflow-hidden p-1.5 shrink-0 ${t.logo}`}>
          {isBank ? (
            bank?.logo ? (
              <img src={bank.logo} alt="" className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <Building2 className="w-6 h-6 text-[#2968C8]" aria-hidden="true" />
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
        <div className="min-w-0 flex-1">
          <span className={`block text-xs font-semibold uppercase tracking-wide truncate ${t.muted}`}>{brandName}</span>
          <span className={`block text-xs font-semibold ${t.link}`}>{isBank ? 'Promoción con tarjeta' : 'Cupón de descuento'}</span>
        </div>
        <div className="shrink-0">{expiryBadge}</div>
      </div>

      {/* Detalle */}
      <div className="flex-1 min-w-0 px-4 pt-3 pb-4 flex flex-col gap-3">
        <h3 className={`text-base font-semibold leading-snug line-clamp-2 ${t.title}`}>{title}</h3>

        {benefit && (
          <span className={`self-start inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold ${t.green}`}>{benefit}</span>
        )}

        {(conditions.length > 0 || cupon.description) && (
          <ul className={`text-sm leading-snug space-y-0.5 ${t.muted}`}>
            {conditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
            {cupon.description && <li className="line-clamp-2">{cupon.description}</li>}
          </ul>
        )}

        {cupon.code && (
          <div className={`rounded-md border border-dashed px-3 py-2 flex items-center justify-between gap-2 ${t.box}`}>
            <div className="min-w-0">
              <span className={`block text-[11px] font-semibold uppercase tracking-wider ${t.muted}`}>Código</span>
              <span className={`block font-mono font-bold text-lg tracking-widest truncate ${t.title}`}>{maskCode(cupon.code)}</span>
            </div>
            <span className={`text-[11px] text-right leading-tight ${t.muted}`}>Se muestra completo<br />al copiarlo</span>
          </div>
        )}

        <button
          type="button"
          onClick={onCopy}
          className="mt-auto w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#3483FA] hover:bg-[#2968C8] active:scale-[0.99] text-white font-semibold text-sm py-2.5 px-4 rounded-md transition-colors"
        >
          {cupon.code ? <Copy className="w-4 h-4 shrink-0" aria-hidden="true" /> : <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />}
          <span>{cupon.code ? 'Copiar código y usarlo' : 'Ver promoción'}</span>
        </button>
      </div>

      {/* Reacciones */}
      <div className={`flex items-center justify-between gap-2 px-4 py-2.5 border-t ${t.line}`}>
        <span className={`text-xs ${t.muted}`}>¿Te funcionó?</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReact('like')}
            aria-pressed={reaction === 'like'}
            aria-label={`Me funcionó (${counts.like})`}
            className={`min-h-[40px] min-w-[52px] px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 border transition ${reaction === 'like' ? t.like : t.react}`}
          >
            <ThumbsUp className="w-4 h-4" aria-hidden="true" /> {counts.like}
          </button>
          <button
            type="button"
            onClick={() => onReact('heart')}
            aria-pressed={reaction === 'heart'}
            aria-label={`Me encanta (${counts.heart})`}
            className={`min-h-[40px] min-w-[52px] px-3 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 border transition ${reaction === 'heart' ? t.heart : t.react}`}
          >
            <Heart className={`w-4 h-4 ${reaction === 'heart' ? 'fill-current' : ''}`} aria-hidden="true" /> {counts.heart}
          </button>
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
