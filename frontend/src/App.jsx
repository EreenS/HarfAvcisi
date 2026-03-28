import { useState } from 'react'
import axios from 'axios'

function App() {
  const [harf, setHarf] = useState("?");
  const [isSpinning, setIsSpinning] = useState(false);
  const [cevaplar, setCevaplar] = useState({
    isim: '', sehir: '', hayvan: '', bitki: '', esya: ''
  });
  // 1. Yeni State: Backend'den gelen doğrulama sonuçlarını tutar
  const [sonuclar, setSonuclar] = useState({});

  const kategoriler = [
    { id: 'isim', label: 'İsim', icon: '👤' },
    { id: 'sehir', label: 'Şehir', icon: '📍' },
    { id: 'hayvan', label: 'Hayvan', icon: '🐾' },
    { id: 'bitki', label: 'Bitki', icon: '🌿' },
    { id: 'esya', label: 'Eşya', icon: '📦' }
  ];

  const handleInputChange = (katId, value) => {
    setCevaplar(prev => ({ ...prev, [katId]: value }));
  };

  const harfSec = () => {
    // 2. Yeni Harf Seçilince her şeyi sıfırla
    setSonuclar({}); 
    setCevaplar({ isim: '', sehir: '', hayvan: '', bitki: '', esya: '' });
    
    setIsSpinning(true);
    const alfabe = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
    let count = 0;
    const interval = setInterval(() => {
      setHarf(alfabe[Math.floor(Math.random() * alfabe.length)]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 50);
  };

  const puanla = async () => {
    try {
      const response = await axios.post('http://localhost:5269/api/game/validate', {
        selectedLetter: harf,
        answers: cevaplar
      });

      const { totalScore, validations } = response.data;
      
      // 3. Backend'den gelen doğruları/yanlışları state'e kaydet
      setSonuclar(validations); 
      
      alert(`Oyun bitti! Toplam Puanın: ${totalScore}`);
    } catch (error) {
      console.error("Hata:", error);
      alert("Backend uykuda mı? Veriyi gönderemedim!");
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center p-4 font-sans text-slate-100 overflow-hidden">
      
      <div className="text-center mb-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-lg">
          HARF <span className="text-yellow-400">AVCISI</span>
        </h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border-4 border-yellow-400 flex flex-col gap-4">
        
        <div className="flex flex-col items-center">
          <div className={`text-6xl font-black mb-2 transition-all duration-300 ${isSpinning ? 'animate-bounce scale-110' : 'scale-100 text-indigo-600'}`}>
            {harf}
          </div>
          <button 
            onClick={harfSec}
            disabled={isSpinning}
            className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-2 px-6 rounded-full shadow-md transform active:scale-95 transition-all disabled:opacity-50 text-lg"
          >
            {harf === "?" ? "HARFİ YAKALA!" : "YENİ HARF SEÇ"}
          </button>
        </div>

        <div className="space-y-2">
          {kategoriler.map((kat) => (
            <div key={kat.id} className="relative">
              <label className="text-xs font-bold text-indigo-800 ml-1 mb-0.5 block uppercase tracking-wider">
                {kat.icon} {kat.label}
              </label>
              
              {/* 4. Dinamik Renk Sınıfları */}
              <input 
                type="text" 
                className={`w-full border-2 rounded-lg py-2 px-3 outline-none transition-all font-semibold text-sm ${
                  sonuclar[kat.id] === true 
                    ? 'border-green-500 bg-green-50 text-green-900 ring-2 ring-green-200' 
                    : sonuclar[kat.id] === false 
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200' 
                    : 'border-indigo-100 bg-indigo-50 text-slate-900 focus:border-yellow-400'
                }`}
                placeholder={harf === "?" ? "Harf seç..." : `${harf} ile...`}
                disabled={harf === "?"}
                value={cevaplar[kat.id] || ''}
                onChange={(e) => handleInputChange(kat.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button 
          className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-lg transform transition-all active:scale-95 text-lg uppercase tracking-widest"
          onClick={puanla}
        >
          BİTTİ! (PUANLA)
        </button>
      </div>
      
      <footer className="mt-4 text-slate-500 text-xs font-medium italic">
        © 2026 Harf Avcısı - Berat Eren SEVİNDİ
      </footer>
    </div>
  )
}

export default App