import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Crown, Layers, Clock, Tag, PlusCircle, 
  ChevronDown, Check, Mail, Lock, X, Trash2, AlertCircle, Upload 
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '')).replace(/\/+$/, '');
if (!API_URL) throw new Error('Configura VITE_API_URL con la URL del backend antes de compilar para producción.');
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function getImageUrl(imageUrl) {
  if (!imageUrl) return 'https://via.placeholder.com/200x250/e2e8f0/cbd5e1?text=Figura';
  // Normalize URLs saved by the previous local-only backend.
  if (API_ORIGIN && /^http:\/\/localhost:\d+\/uploads\//.test(imageUrl)) {
    return `${API_ORIGIN}${imageUrl.replace(/^http:\/\/localhost:\d+/, '')}`;
  }
  return imageUrl;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [figures, setFigures] = useState([]);
  const [categories, setCategories] = useState([]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Más recientes');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas las categorías');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddFigureModal, setShowAddFigureModal] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showCategoryFilterDropdown, setShowCategoryFilterDropdown] = useState(false);

  const [newFigure, setNewFigure] = useState({
    name: '',
    category: '',
    costo: '',
    valorUsd: '',
    imageFile: null
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchFigures();
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchFigures = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/figures`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFigures(response.data);
    } catch (error) {
      console.error("Error al cargar figuras:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(response.data);
      if (response.data.length > 0 && !newFigure.category) {
        setNewFigure(prev => ({ ...prev, category: response.data[0].name }));
      }
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const endpoint = isLoginTab ? `${API_URL}/auth/login` : `${API_URL}/auth/register`;
      const response = await axios.post(endpoint, { email, password });

      if (response.data.token || response.status === 200 || response.status === 201) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // 1. Activamos la animación de vuelo hacia arriba
        setIsExiting(true);
        
        // 2. Esperamos exactamente 600ms a que termine la animación antes de cambiar de página
        setTimeout(() => {
          setIsAuthenticated(true);
        }, 600);
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      setErrorMessage(
        error.response?.data?.message || 
        'No se pudo conectar con el servidor. Verifica la conexión e inténtalo de nuevo.'
      );
      setLoading(false);
    }
  };

  const handleCostoChange = (e) => {
    const costoSoles = e.target.value;
    
    if (costoSoles === '') {
      setNewFigure(prev => ({ ...prev, costo: '', valorUsd: '' }));
      return;
    }

    const numSoles = parseFloat(costoSoles);
    if (!isNaN(numSoles)) {
      const calculoUsd = (numSoles / 3.47).toFixed(2);
      setNewFigure(prev => ({
        ...prev,
        costo: costoSoles,
        valorUsd: calculoUsd
      }));
    } else {
      setNewFigure(prev => ({ ...prev, costo: costoSoles }));
    }
  };

  const handleAddFigureSubmit = async (e) => {
    e.preventDefault();
    if (!newFigure.name || !newFigure.costo) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', newFigure.name);
      formData.append('category', newFigure.category || (categories[0]?.name ?? 'General'));
      formData.append('costo', `S/${newFigure.costo}`);
      formData.append('valorUsd', `$ ${newFigure.valorUsd || '0.00'}`);
      
      if (newFigure.imageFile) {
        formData.append('image', newFigure.imageFile);
      }

      const response = await axios.post(`${API_URL}/figures`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setFigures([response.data, ...figures]);
      setNewFigure({ name: '', category: categories[0]?.name || '', costo: '', valorUsd: '', imageFile: null });
      setShowAddFigureModal(false);
    } catch (error) {
      console.error("Error al guardar figura:", error);
    }
  };

  const handleDeleteFigure = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/figures/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFigures(figures.filter(fig => fig._id !== id && fig.id !== id));
    } catch (error) {
      console.error("Error al eliminar figura:", error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/categories`, {
        name: newCategoryName,
        icon: newCategoryIcon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCategories([...categories, response.data]);
      setNewCategoryName('');
      setNewCategoryIcon('📦');
    } catch (error) {
      console.error("Error al crear categoría:", error);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(categories.filter(cat => cat._id !== id && cat.id !== id));
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
    }
  };

  const filteredFigures = figures.filter(fig => {
    const matchesSearch = fig.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'Todas las categorías' || fig.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const priceA = parseFloat(String(a.costo).replace(/[^0-9.]/g, '')) || 0;
    const priceB = parseFloat(String(b.costo).replace(/[^0-9.]/g, '')) || 0;

    if (sortOption === 'Más recientes') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortOption === 'Más antiguas') {
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    }
    if (sortOption === 'Mayor precio') {
      return priceB - priceA;
    }
    if (sortOption === 'Menor precio') {
      return priceA - priceB;
    }
    if (sortOption === 'Nombre A-Z') {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === 'Nombre Z-A') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen gamer-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Se aplica la clase animate-fly-up cuando isExiting pasa a true */}
        <div className={`w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl relative z-10 ${isExiting ? 'animate-fly-up' : 'animate-zoom-in'}`}>
          <h1 className="text-4xl font-extrabold text-center tracking-wider mb-1 text-gray-900 animate-fade-in-down">
            Osmar Figuras
          </h1>
          <p className="text-center text-gray-500 text-xs tracking-widest uppercase mb-6 animate-fade-in-down">
            Accede a tu colección personal
          </p>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex border-b border-gray-200 mb-6">
            <button 
              onClick={() => { setIsLoginTab(true); setErrorMessage(''); }}
              className={`flex-1 pb-3 font-semibold text-sm transition-all ${isLoginTab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Iniciar Sesión
            </button>
            <button 
              onClick={() => { setIsLoginTab(false); setErrorMessage(''); }}
              className={`flex-1 pb-3 font-semibold text-sm transition-all ${!isLoginTab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">Correo electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tucorreo@gmail.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-700 block mb-1 font-medium">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            >
              {loading ? 'Conectando...' : (isLoginTab ? 'Entrar' : 'Registrar Cuenta')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex">
      {/* BARRA LATERAL BEIGE CON ANIMACIÓN DE ENTRADA Y BOTONES FLOTANTES */}
      <aside className="w-64 border-r border-amber-900/10 p-5 flex flex-col justify-between min-h-screen bg-[#f5f2eb] animate-slide-in-up">
        <div>
          <div className="flex items-center gap-2 mb-8 animate-floating">
            <Crown className="w-5 h-5 text-amber-600" />
            <div>
              <span className="font-bold text-sm block leading-tight text-gray-900">Osmar Figuras</span>
              <span className="text-[10px] text-gray-500 tracking-wider">COLLECTION MANAGER</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative animate-floating" style={{ animationDelay: '0.1s' }}>
              <button 
                onClick={() => setShowCategoryFilterDropdown(!showCategoryFilterDropdown)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-amber-900/10 text-sm font-medium bg-white text-gray-800 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <span className="truncate">{selectedCategoryFilter}</span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>

              {showCategoryFilterDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
                  <div 
                    onClick={() => { setSelectedCategoryFilter('Todas las categorías'); setShowCategoryFilterDropdown(false); }}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between text-gray-800"
                  >
                    <span>Todas las categorías</span>
                    {selectedCategoryFilter === 'Todas las categorías' && <Check className="w-4 h-4 text-amber-600" />}
                  </div>
                  {categories.map(cat => (
                    <div 
                      key={cat._id || cat.id}
                      onClick={() => { setSelectedCategoryFilter(cat.name); setShowCategoryFilterDropdown(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center justify-between text-gray-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{cat.icon}</span>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      {selectedCategoryFilter === cat.name && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative animate-floating" style={{ animationDelay: '0.2s' }}>
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-amber-900/10 text-sm font-medium bg-white text-gray-800 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{sortOption}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>

              {showSortDropdown && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 text-sm">
                  {['Más recientes', 'Más antiguas', 'Mayor precio', 'Menor precio', 'Nombre A-Z', 'Nombre Z-A'].map(opt => (
                    <div 
                      key={opt}
                      onClick={() => { setSortOption(opt); setShowSortDropdown(false); }}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between text-gray-800"
                    >
                      <span className={sortOption === opt ? 'text-amber-600 font-medium' : 'text-gray-700'}>{opt}</span>
                      {sortOption === opt && <Check className="w-4 h-4 text-amber-600" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="animate-floating" style={{ animationDelay: '0.3s' }}>
              <button 
                onClick={() => setShowCategoryModal(true)}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-amber-900/10 text-sm font-medium bg-white text-gray-800 hover:bg-gray-50 shadow-sm transition cursor-pointer"
              >
                <Tag className="w-4 h-4 text-gray-500" />
                <span>Categorías</span>
              </button>
            </div>

            <div className="animate-floating" style={{ animationDelay: '0.4s' }}>
              <button 
                onClick={() => setShowAddFigureModal(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg border border-amber-600/40 text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 transition text-sm font-semibold shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Agregar Figura</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-amber-900/10 text-[11px] text-gray-500 text-center">
          © 2026 Osmar Figuras
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-5xl font-black text-center mb-8 tracking-wide text-gray-900 animate-slide-in-up">
          Osmar Figuras
        </h1>

        <div className="max-w-2xl mx-auto mb-8 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar figuras por nombre..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-start shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase">TOTAL FIGURAS:</span>
              <span className="text-3xl font-extrabold text-gray-900 block mt-1">{filteredFigures.length}</span>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <Layers className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold text-gray-900">Mi Almacén</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFigures.map(fig => (
            <div key={fig._id || fig.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col justify-between relative group shadow-sm">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-10 flex gap-1">
                <button 
                  onClick={() => handleDeleteFigure(fig._id || fig.id)}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition cursor-pointer"
                  title="Eliminar figura"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="h-56 bg-gray-100 relative overflow-hidden flex items-center justify-center p-2">
                <img 
                  src={getImageUrl(fig.imageUrl)} 
                  alt={fig.name} 
                  className="h-full object-contain hover:scale-105 transition duration-300" 
                />
                <span className="absolute top-2 left-2 text-[10px] bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/10">
                  {fig.category}
                </span>
              </div>
              <div className="p-4 border-t border-gray-100">
                <h3 className="font-semibold text-sm text-gray-900 truncate mb-3">{fig.name}</h3>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">COSTO</span>
                    <span className="font-bold text-gray-900">{fig.costo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 block uppercase">VALOR USD</span>
                    <span className="font-bold text-amber-600">{fig.valorUsd}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL: AGREGAR FIGURA */}
      {showAddFigureModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Agregar Nueva Figura</h3>
              </div>
              <button onClick={() => setShowAddFigureModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFigureSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-700 block mb-1 font-medium">Nombre de la figura</label>
                <input 
                  type="text" 
                  required
                  value={newFigure.name}
                  onChange={(e) => setNewFigure({...newFigure, name: e.target.value})}
                  placeholder="Ej: Goku Super Saiyan"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Categoría</label>
                  <select 
                    value={newFigure.category}
                    onChange={(e) => setNewFigure({...newFigure, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Costo en Soles (S/)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newFigure.costo}
                    onChange={handleCostoChange}
                    placeholder="200.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Valor USD ($) (Auto a 3.47)</label>
                  <input 
                    type="text" 
                    readOnly
                    value={newFigure.valorUsd ? `$ ${newFigure.valorUsd}` : ''}
                    placeholder="$ 0.00"
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-amber-600 font-bold outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-700 block mb-1 font-medium">Subir Foto</label>
                  <label className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 flex items-center justify-between cursor-pointer hover:border-amber-500 transition">
                    <span className="truncate">{newFigure.imageFile ? newFigure.imageFile.name : 'Seleccionar archivo...'}</span>
                    <Upload className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => setNewFigure({...newFigure, imageFile: e.target.files[0]})}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddFigureModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition cursor-pointer"
                >
                  Guardar Figura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIONAR CATEGORÍAS */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-gray-900">Gestionar Categorías</h3>
              </div>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="mb-6 flex gap-2">
              <input 
                type="text" 
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="Icono"
                className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-center text-sm text-gray-900 outline-none focus:border-amber-500"
              />
              <input 
                type="text" 
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-amber-500"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600 text-white font-bold text-sm rounded-lg hover:bg-amber-700 transition cursor-pointer">
                Crear
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categories.map(cat => (
                <div key={cat._id || cat.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-lg flex-shrink-0">{cat.icon}</span>
                    <span className="font-semibold text-sm text-gray-900 truncate">{cat.name}</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteCategory(cat._id || cat.id)}
                    className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
