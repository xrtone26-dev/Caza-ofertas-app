// Categorías principales de Mercado Libre México y clasificador automático de productos.
// Orden = prioridad en caso de empate (lo más específico primero).
//
// Cómo clasifica `classifyProduct(p)`:
//  1. Si el producto ya trae categoría propia (category / categoria / category_name / categoría),
//     se respeta cuando coincide con alguna de las categorías de abajo (por id, nombre o sinónimo).
//  2. Si no, puntúa título (x3), marca (x3) y descripción (x1) contra palabras clave de cada categoría
//     y gana la de mayor puntaje. Sin coincidencias → "otras".

const strip = (s) =>
  String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ$%+\s/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Cada palabra clave se compara por límite de palabra (evita que "tv" coincida con "activo").
const kw = (list) =>
  list.map((w) => {
    const esc = strip(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${esc}(?=$|[^a-z0-9])`, 'g');
  });

const RAW_CATEGORIES = [
  {
    id: 'celulares', label: 'Celulares y Teléfonos', short: 'Celulares', icon: '📱',
    synonyms: ['celulares', 'telefonos', 'smartphones', 'celular'],
    words: ['celular', 'celulares', 'smartphone', 'iphone', 'galaxy', 'redmi', 'poco', 'xiaomi', 'motorola', 'moto g', 'moto e', 'moto edge', 'realme', 'oppo', 'honor', 'zte', 'nokia', 'pixel', 'telefono', 'smartwatch', 'smartband', 'smart band', 'apple watch', 'funda para celular', 'mica', 'cargador', 'power bank', 'powerbank', 'cable usb', 'cable lightning', 'cable tipo c', 'telefono inalambrico', 'huawei', 'tecno', 'infinix'],
  },
  {
    id: 'computacion', label: 'Computación', short: 'Computación', icon: '💻',
    synonyms: ['computacion', 'computadoras', 'laptops', 'tablets'],
    words: ['laptop', 'laptops', 'macbook', 'notebook', 'portatil', 'chromebook', 'computadora', 'pc', 'all in one', 'monitor', 'teclado', 'mouse', 'raton', 'impresora', 'tinta', 'toner', 'router', 'modem', 'access point', 'ssd', 'disco duro', 'memoria usb', 'pendrive', 'micro sd', 'memoria ram', 'tarjeta de video', 'procesador', 'ryzen', 'intel core', 'tablet', 'ipad', 'webcam', 'hub usb', 'lenovo', 'hp', 'dell', 'asus', 'acer', 'msi', 'kindle', 'regulador', 'no break'],
  },
  {
    id: 'consolas', label: 'Consolas y Videojuegos', short: 'Videojuegos', icon: '🎮',
    synonyms: ['consolas', 'videojuegos', 'gaming', 'gamer'],
    words: ['consola', 'playstation', 'ps5', 'ps4', 'ps3', 'xbox', 'nintendo', 'switch', 'steam deck', 'videojuego', 'videojuegos', 'gamer', 'gaming', 'joystick', 'gamepad', 'dualsense', 'dualshock', 'control inalambrico', 'silla gamer', 'headset gamer', 'rog ally', 'mario', 'zelda', 'fifa', 'ea sports', 'fc 25', 'fc 26', 'call of duty'],
  },
  {
    id: 'electronica', label: 'Electrónica, Audio y Video', short: 'Audio y Video', icon: '🎧',
    synonyms: ['electronica', 'audio', 'video', 'tv', 'television'],
    words: ['audifonos', 'audifono', 'earbuds', 'airpods', 'bocina', 'bocinas', 'parlante', 'altavoz', 'soundbar', 'barra de sonido', 'bluetooth', 'jbl', 'sony', 'bose', 'beats', 'smart tv', 'television', 'televisor', 'pantalla', 'tv', 'roku', 'fire tv', 'chromecast', 'google tv', 'proyector', 'microfono', 'home theater', 'estereo', 'tocadiscos', 'radio', 'streaming', 'alexa', 'echo dot', 'qled', 'oled', 'uhd', '4k', 'lg', 'hisense', 'tcl', 'samsung tv', 'amplificador'],
  },
  {
    id: 'camaras', label: 'Cámaras y Accesorios', short: 'Cámaras', icon: '📷',
    synonyms: ['camaras', 'fotografia'],
    words: ['camara', 'camaras', 'gopro', 'canon', 'nikon', 'fujifilm', 'instax', 'tripie', 'tripode', 'lente', 'camara de seguridad', 'camara ip', 'dron', 'drone', 'dji', 'camara web', 'videocamara', 'ring doorbell', 'timbre inteligente', 'reolink', 'tapo'],
  },
  {
    id: 'electrodomesticos', label: 'Electrodomésticos y Aires Ac.', short: 'Electrodomésticos', icon: '🧊',
    synonyms: ['electrodomesticos', 'aires acondicionados'],
    words: ['refrigerador', 'refri', 'lavadora', 'secadora', 'microondas', 'estufa', 'parrilla electrica', 'horno', 'aire acondicionado', 'minisplit', 'mini split', 'ventilador', 'calentador', 'boiler', 'aspiradora', 'robot aspirador', 'roomba', 'licuadora', 'batidora', 'cafetera', 'freidora de aire', 'air fryer', 'freidora', 'tostador', 'plancha', 'olla de presion', 'olla arrocera', 'arrocera', 'procesador de alimentos', 'extractor', 'lavavajillas', 'purificador', 'humidificador', 'deshumidificador', 'exprimidor', 'hervidor', 'sandwichera', 'waflera', 'nutribullet', 'instant pot', 'oster', 'mabe', 'whirlpool', 'cuisinart', 'nespresso', 'dolce gusto'],
  },
  {
    id: 'hogar', label: 'Hogar, Muebles y Jardín', short: 'Hogar y Jardín', icon: '🏠',
    synonyms: ['hogar', 'muebles', 'jardin', 'cocina'],
    words: ['hogar', 'mueble', 'muebles', 'sofa', 'sillon', 'cama', 'colchon', 'almohada', 'sabana', 'sabanas', 'edredon', 'cobija', 'cortina', 'tapete', 'alfombra', 'escritorio', 'silla', 'mesa', 'comedor', 'librero', 'closet', 'ropero', 'organizador', 'cocina', 'sarten', 'sartenes', 'batería de cocina', 'bateria de cocina', 'vajilla', 'vaso', 'vasos', 'termo', 'taza', 'cuchillo', 'cuchillos', 'tupper', 'recipiente', 'lampara', 'foco', 'iluminacion', 'jardin', 'maceta', 'manguera', 'asador', 'parrilla', 'carpa', 'alberca', 'toalla', 'toallas', 'baño', 'regadera', 'cesto', 'espejo', 'decoracion', 'cuadro', 'reloj de pared', 'cerradura', 'cerradura inteligente', 'foco inteligente'],
  },
  {
    id: 'herramientas', label: 'Herramientas', short: 'Herramientas', icon: '🛠️',
    synonyms: ['herramientas', 'construccion'],
    words: ['herramienta', 'herramientas', 'taladro', 'rotomartillo', 'atornillador', 'esmeriladora', 'sierra', 'caladora', 'compresor', 'soldadora', 'multimetro', 'llave', 'llaves', 'dado', 'dados', 'destornillador', 'juego de herramientas', 'caja de herramientas', 'pinzas', 'martillo', 'nivel laser', 'cinta metrica', 'dewalt', 'bosch', 'truper', 'makita', 'milwaukee', 'stanley', 'black decker', 'pintura', 'brocha', 'escalera', 'lijadora', 'hidrolavadora', 'generador'],
  },
  {
    id: 'vehiculos', label: 'Accesorios para Vehículos', short: 'Autos y Motos', icon: '🚗',
    synonyms: ['accesorios para vehiculos', 'autos', 'vehiculos', 'carros motos'],
    words: ['auto', 'autos', 'carro', 'coche', 'vehiculo', 'moto', 'motocicleta', 'casco', 'llanta', 'llantas', 'rin', 'rines', 'aceite', 'aceite sintetico', 'bateria para auto', 'limpiaparabrisas', 'cubre asientos', 'funda para asiento', 'dashcam', 'camara de reversa', 'gps', 'inflador', 'cargador de auto', 'cables pasa corriente', 'cera', 'autoestereo', 'estereo para auto', 'tapete para auto', 'cubierta para auto', 'portabicicletas', 'refaccion', 'amortiguador', 'balatas', 'filtro de aceite', 'bujia', 'michelin', 'pirelli', 'bardahl', 'mobil', 'castrol', 'valvoline'],
  },
  {
    id: 'deportes', label: 'Deportes y Fitness', short: 'Deportes', icon: '⚽',
    synonyms: ['deportes', 'fitness', 'deportes y fitness'],
    words: ['deporte', 'deportes', 'fitness', 'gimnasio', 'gym', 'pesas', 'mancuerna', 'mancuernas', 'barra olimpica', 'caminadora', 'bicicleta', 'bici', 'bicicleta estatica', 'spinning', 'yoga', 'tapete de yoga', 'pilates', 'balon', 'futbol', 'basquetbol', 'voleibol', 'tenis de mesa', 'raqueta', 'natacion', 'googles', 'bicicleta de montaña', 'patines', 'patineta', 'scooter', 'skate', 'campismo', 'tienda de campaña', 'casa de campaña', 'sleeping bag', 'bolsa de dormir', 'mochila de senderismo', 'proteina', 'creatina', 'suplemento', 'banda de resistencia', 'liga de resistencia', 'cuerda para saltar', 'boxeo', 'guantes de box', 'costal', 'pesca', 'caña de pescar', 'caza', 'elíptica', 'eliptica', 'rodillo', 'foam roller', 'ciclismo', 'running', 'garmin', 'fitbit', 'coleman', 'decathlon', 'running'],
  },
  {
    id: 'ropa', label: 'Ropa, Bolsas y Calzado', short: 'Ropa y Calzado', icon: '👟',
    synonyms: ['ropa', 'calzado', 'moda', 'ropa bolsas y calzado', 'ropa y accesorios'],
    words: ['ropa', 'playera', 'playeras', 'camiseta', 'camisa', 'pantalon', 'jeans', 'short', 'shorts', 'vestido', 'falda', 'sudadera', 'chamarra', 'abrigo', 'sueter', 'blusa', 'pijama', 'ropa interior', 'boxer', 'calcetines', 'calzado', 'zapato', 'zapatos', 'tenis', 'tennis', 'sandalias', 'botas', 'bota', 'tacones', 'mocasines', 'huaraches', 'zapatillas', 'bolsa', 'bolsas', 'bolso', 'mochila', 'cartera', 'cinturon', 'gorra', 'lentes de sol', 'bufanda', 'guantes', 'maleta', 'maletas', 'equipaje', 'lentes', 'levis', 'converse', 'vans', 'skechers', 'new balance', 'crocs', 'zara', 'calvin klein', 'tommy hilfiger', 'lacoste', 'nike', 'adidas', 'puma', 'under armour', 'reebok', 'ropa deportiva', 'leggins', 'licra', 'traje de baño', 'brasier'],
  },
  {
    id: 'joyas', label: 'Joyas y Relojes', short: 'Joyas y Relojes', icon: '⌚',
    synonyms: ['joyas', 'relojes', 'joyas y relojes'],
    words: ['reloj', 'relojes', 'casio', 'g-shock', 'gshock', 'seiko', 'citizen', 'fossil', 'timex', 'invicta', 'swatch', 'joya', 'joyeria', 'collar', 'pulsera', 'anillo', 'aretes', 'arete', 'cadena', 'dije', 'plata 925', 'oro', 'diamante', 'mancuernillas', 'reloj de pulsera'],
  },
  {
    id: 'belleza', label: 'Belleza y Cuidado Personal', short: 'Belleza', icon: '💄',
    synonyms: ['belleza', 'cuidado personal', 'belleza y cuidado personal'],
    words: ['belleza', 'perfume', 'perfumes', 'fragancia', 'colonia', 'maquillaje', 'labial', 'rimel', 'mascara de pestañas', 'sombras', 'base de maquillaje', 'brocha de maquillaje', 'shampoo', 'champu', 'acondicionador', 'crema', 'crema facial', 'serum', 'protector solar', 'bloqueador', 'skincare', 'cuidado de la piel', 'desodorante', 'rastrillo', 'afeitadora', 'rasuradora', 'barba', 'recortadora', 'secadora de cabello', 'secador de cabello', 'plancha de cabello', 'alisadora', 'rizador', 'tinte', 'esmalte', 'uñas', 'cepillo electrico', 'cepillo dental', 'pasta dental', 'enjuague bucal', 'depilacion', 'depiladora', 'jabon', 'gel de baño', 'cuidado capilar', 'loreal', 'nivea', 'garnier', 'maybelline', 'revlon', 'oral-b', 'oral b', 'philips one blade', 'gillette', 'braun', 'wahl', 'babyliss', 'dove', 'pantene', 'head shoulders', 'elvive'],
  },
  {
    id: 'salud', label: 'Salud y Equipo Médico', short: 'Salud', icon: '🩺',
    synonyms: ['salud', 'equipo medico', 'salud y equipo medico'],
    words: ['salud', 'vitamina', 'vitaminas', 'multivitaminico', 'colageno', 'omega 3', 'probiotico', 'termometro', 'baumanometro', 'oximetro', 'glucometro', 'tensiometro', 'cubrebocas', 'gel antibacterial', 'botiquin', 'ortopedico', 'rodillera', 'faja', 'muletas', 'silla de ruedas', 'nebulizador', 'masajeador', 'pistola de masaje', 'masaje', 'tens', 'lentes de contacto', 'bascula', 'báscula', 'medico', 'dental', 'primeros auxilios', 'tapones para oidos', 'cpap'],
  },
  {
    id: 'bebes', label: 'Bebés', short: 'Bebés', icon: '🍼',
    synonyms: ['bebes', 'bebe'],
    words: ['bebe', 'bebes', 'pañal', 'pañales', 'toallitas humedas', 'biberon', 'mamila', 'chupon', 'carriola', 'portabebe', 'cuna', 'corral', 'andadera', 'periquera', 'silla para auto bebe', 'monitor para bebe', 'baby', 'formula infantil', 'enfamil', 'huggies', 'pampers', 'chicco', 'evenflo', 'fisher price', 'esterilizador', 'extractor de leche', 'mameluco', 'recien nacido'],
  },
  {
    id: 'juguetes', label: 'Juegos y Juguetes', short: 'Juguetes', icon: '🧸',
    synonyms: ['juguetes', 'juegos y juguetes', 'juegos'],
    words: ['juguete', 'juguetes', 'lego', 'muñeca', 'muñeco', 'peluche', 'hot wheels', 'barbie', 'nerf', 'play doh', 'playdoh', 'rompecabezas', 'juego de mesa', 'monopoly', 'jenga', 'figura de accion', 'funko', 'carrito', 'montable', 'triciclo', 'trampolin', 'resbaladilla', 'alberca inflable', 'pistola de agua', 'bloques', 'mega bloks', 'tomy', 'mattel', 'hasbro', 'playmobil', 'squishmallows', 'bakugan', 'pokemon', 'dron de juguete', 'carro de control remoto', 'slime'],
  },
  {
    id: 'alimentos', label: 'Alimentos y Bebidas', short: 'Alimentos', icon: '🍫',
    synonyms: ['alimentos', 'bebidas', 'alimentos y bebidas', 'despensa'],
    words: ['alimento', 'alimentos', 'cafe', 'cafe molido', 'cafe en grano', 'capsulas de cafe', 'cereal', 'chocolate', 'galletas', 'botana', 'botanas', 'snack', 'dulces', 'miel', 'aceite de oliva', 'arroz', 'frijol', 'pasta', 'atun', 'leche', 'vino', 'tequila', 'whisky', 'cerveza', 'mezcal', 'refresco', 'agua mineral', 'jugo', 'barra de proteina', 'avena', 'granola', 'nutella', 'sazonador', 'salsa', 'harina', 'azucar', 'endulzante', 'despensa', 'abarrotes'],
  },
  {
    id: 'mascotas', label: 'Animales y Mascotas', short: 'Mascotas', icon: '🐶',
    synonyms: ['mascotas', 'animales y mascotas', 'animales'],
    words: ['mascota', 'mascotas', 'perro', 'perros', 'gato', 'gatos', 'croquetas', 'alimento para perro', 'alimento para gato', 'arena para gato', 'collar para perro', 'correa', 'arnes', 'transportadora', 'rascador', 'juguete para perro', 'acuario', 'pecera', 'whiskas', 'pedigree', 'dog chow', 'purina', 'royal canin', 'hills', 'antipulgas', 'shampoo para perro', 'cama para perro'],
  },
  {
    id: 'instrumentos', label: 'Instrumentos Musicales', short: 'Instrumentos', icon: '🎸',
    synonyms: ['instrumentos musicales', 'instrumentos'],
    words: ['guitarra', 'bajo electrico', 'piano', 'teclado musical', 'bateria musical', 'ukulele', 'violin', 'flauta', 'saxofon', 'trompeta', 'armonica', 'microfono de estudio', 'interfaz de audio', 'amplificador de guitarra', 'pedal de efectos', 'cuerdas para guitarra', 'yamaha', 'fender', 'ibanez', 'casio privia', 'cajon', 'sintetizador', 'controlador midi', 'consola dj', 'bocina para karaoke'],
  },
  {
    id: 'libros', label: 'Libros, Papelería y Arte', short: 'Libros y Papelería', icon: '📚',
    synonyms: ['libros', 'papeleria', 'arte', 'libros revistas y comics', 'arte papeleria y merceria'],
    words: ['libro', 'libros', 'novela', 'comic', 'manga', 'revista', 'enciclopedia', 'cuaderno', 'libreta', 'agenda', 'papeleria', 'boligrafo', 'pluma', 'lapiz', 'plumones', 'marcadores', 'pintura acrilica', 'acuarela', 'lienzo', 'pincel', 'carpeta', 'folder', 'engrapadora', 'calculadora', 'mochila escolar', 'kit escolar', 'diccionario', 'biblia', 'harry potter', 'tinta china', 'plastilina', 'manualidades', 'costura', 'maquina de coser', 'estambre', 'cricut', 'silhouette', 'moleskine', 'bic', 'faber castell', 'prismacolor', 'crayola'],
  },
  {
    id: 'fiestas', label: 'Fiestas y Cotillón', short: 'Fiestas', icon: '🎉',
    synonyms: ['fiestas', 'cotillon', 'souvenirs cotillon y fiestas'],
    words: ['fiesta', 'fiestas', 'cotillon', 'globos', 'piñata', 'pinata', 'serpentinas', 'confeti', 'disfraz', 'disfraces', 'decoracion de fiesta', 'adorno navideño', 'navidad', 'arbol de navidad', 'luces navideñas', 'esfera', 'halloween', 'souvenir', 'souvenirs', 'regalo', 'regalos', 'tarjeta de felicitacion', 'velas', 'centro de mesa', 'bocadillos'],
  },
  {
    id: 'industrias', label: 'Industrias y Oficinas', short: 'Oficina', icon: '🏢',
    synonyms: ['industrias y oficinas', 'oficina', 'industrias'],
    words: ['oficina', 'silla de oficina', 'silla ejecutiva', 'escritorio de oficina', 'archivero', 'organizador de escritorio', 'pizarron', 'rotafolio', 'etiquetadora', 'impresora de etiquetas', 'termica', 'lector de codigo de barras', 'punto de venta', 'caja registradora', 'bascula industrial', 'trituradora de papel', 'laminadora', 'encuadernadora', 'maquina de empaque', 'embalaje', 'cinta adhesiva', 'diablito', 'montacargas', 'estante industrial', 'rack', 'guantes de seguridad', 'casco de seguridad', 'chaleco', 'botas industriales'],
  },
];

export const OTHER_CATEGORY = { id: 'otras', label: 'Otras categorías', short: 'Otras', icon: '🛍️' };

export const ML_CATEGORIES = [
  ...RAW_CATEGORIES.map(({ id, label, short, icon }) => ({ id, label, short, icon })),
  OTHER_CATEGORY,
];

const COMPILED = RAW_CATEGORIES.map((c) => ({
  id: c.id,
  re: kw(c.words),
  synonyms: [c.id, strip(c.label), strip(c.short), ...c.synonyms.map(strip)],
}));

const countMatches = (res, text) => {
  if (!text) return 0;
  let n = 0;
  for (const re of res) {
    re.lastIndex = 0;
    if (re.test(text)) n += 1;
  }
  return n;
};

const OWN_FIELDS = ['category', 'categoria', 'category_name', 'categoría', 'ml_category'];

function ownCategory(p) {
  for (const f of OWN_FIELDS) {
    const raw = p && p[f];
    if (!raw) continue;
    const v = strip(typeof raw === 'object' ? raw.name || raw.label || raw.id : raw);
    if (!v) continue;
    const hit = COMPILED.find((c) => c.synonyms.includes(v) || c.synonyms.some((s) => s.length > 4 && v.includes(s)));
    if (hit) return hit.id;
  }
  return null;
}

// Devuelve el id de la categoría ML del producto ('otras' si no hay señal suficiente).
export function classifyProduct(p) {
  if (!p) return OTHER_CATEGORY.id;
  const own = ownCategory(p);
  if (own) return own;

  const title = strip(p.title || p.name || p.titulo);
  const brand = strip(p.brand || p.marca);
  const desc = strip(p.description || p.descripcion);
  if (!title && !desc && !brand) return OTHER_CATEGORY.id;

  let best = OTHER_CATEGORY.id;
  let bestScore = 0;
  for (const c of COMPILED) {
    const score = countMatches(c.re, title) * 3 + countMatches(c.re, brand) * 3 + Math.min(countMatches(c.re, desc), 3);
    if (score > bestScore) {
      best = c.id;
      bestScore = score;
    }
  }
  return best;
}

export const getCategoryById = (id) => ML_CATEGORIES.find((c) => c.id === id) || null;
