import { useState } from 'react'
import axios from 'axios'

function App() {
  const [harf, setHarf] = useState("?");
  const [isSpinning, setIsSpinning] = useState(false);
  const [cevaplar, setCevaplar] = useState({
    isim: '', sehir: '', hayvan: '', bitki: '', esya: ''
  });

  const handleInputChange = (katId, value) => {
    setCevaplar(prev => ({ ...prev, [katId]: value }));
  };
  
  // Kategorilerimiz ve ikonları
  const kategoriler = [
    { id: 'isim', label: 'İsim', icon: '👤' },
    { id: 'sehir', label: 'Şehir', icon: '📍' },
    { id: 'hayvan', label: 'Hayvan', icon: '🐾' },
    { id: 'bitki', label: 'Bitki', icon: '🌿' },
    { id: 'esya', label: 'Eşya', icon: '📦' }
  ];

  const harfSec = () => {
    setIsSpinning(true);
    const alfabe = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ";
    
    // Görsel bir efekt: 1 saniye boyunca harfler hızlıca dönsün
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
      // Backend adresini henüz CORS ayarı yapmadığımız için varsayılan .NET portu (5000 veya 5001) olarak düşünelim
      const response = await axios.post('http://localhost:5269/api/game/validate', {
        selectedLetter: harf,
        answers: cevaplar
      });

      const { totalScore, validations } = response.data;
      alert(`Oyun bitti! Toplam Puanın: ${totalScore}`);
      
      // İleride burada hangi kelimenin yanlış olduğunu kırmızı yakarak gösteririz ;)
      console.log("Detaylı sonuçlar:", validations);

    } catch (error) {
      console.error("Hata:", error);
      alert("Backend uykuda mı ? Veriyi gönderemedim!");
    }
  };

  return (
    // min-h-screen yerine h-screen yaptık, overflow-hidden ile dışarı taşmayı engelledik
    <div className="h-screen bg-gradient-to-b from-slate-900 to-black flex flex-col items-center justify-center p-4 font-sans text-slate-900 overflow-hidden">
      
      <div className="text-center mb-4">
        <h1 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-lg">
          HARF <span className="text-yellow-400">AVCISI</span>
        </h1>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border-4 border-yellow-400 flex flex-col gap-4">
        
        {/* Harf Alanı */}
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
              <input 
                type="text" 
                className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-lg py-2 px-3 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all font-semibold text-sm"
                placeholder={harf === "?" ? "Harf seç..." : `${harf} ile...`}
                disabled={harf === "?"}
                value={cevaplar[kat.id]}
                onChange={(e) => handleInputChange(kat.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Bitti Butonu */}
        <button 
          className="w-full mt-2 bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-lg transform transition-all active:scale-95 text-lg uppercase tracking-widest"
          onClick={puanla}
        >
          BİTTİ! (PUANLA)
        </button>
      </div>
      
      <footer className="mt-4 text-indigo-200 text-xs font-medium">
        © 2026 Harf Avcısı - Berat Eren SEVİNDİ
      </footer>
    </div>
  )
}

export default App