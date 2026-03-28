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
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-purple-700 flex flex-col items-center p-6 font-sans text-slate-900">
      {/* Başlık Alanı */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-white tracking-tighter drop-shadow-lg">
          HARF <span className="text-yellow-400">AVCISI</span>
        </h1>
        <p className="text-indigo-200 mt-2 font-medium italic text-lg">Hızlı olan kazansın!</p>
      </div>

      {/* Ana Oyun Kartı */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border-4 border-yellow-400">
        
        {/* Harf Alanı */}
        <div className="flex flex-col items-center mb-8">
          <div className={`text-8xl font-black mb-4 transition-all duration-300 ${isSpinning ? 'animate-bounce scale-110' : 'scale-100 text-indigo-600'}`}>
            {harf}
          </div>
          <button 
            onClick={harfSec}
            disabled={isSpinning}
            className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-3 px-8 rounded-full shadow-lg transform active:scale-95 transition-all disabled:opacity-50 text-xl"
          >
            {harf === "?" ? "HARFİ YAKALA!" : "YENİ HARF SEÇ"}
          </button>
        </div>

        {/* Form Alanları */}
        <div className="space-y-4">
          {kategoriler.map((kat) => (
            <div key={kat.id} className="relative">
              <label className="text-sm font-bold text-indigo-800 ml-1 mb-1 block uppercase tracking-wider">
                {kat.icon} {kat.label}
              </label>
              <input 
                type="text" 
                className="w-full bg-indigo-50 border-2 border-indigo-100 rounded-xl py-3 px-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-200 transition-all font-semibold"
                placeholder={harf === "?" ? "Önce harf seçin..." : `${harf} ile başlayan...`}
                disabled={harf === "?"}
                value={cevaplar[kat.id]}
                onChange={(e) => handleInputChange(kat.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Bitti Butonu */}
        <button 
          className="w-full mt-8 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-xl transform transition-all active:scale-95 text-xl uppercase tracking-widest"
          onClick={puanla}
        >
          BİTTİ! (PUANLA)
        </button>
      </div>
      
      <footer className="mt-8 text-indigo-200 text-sm font-medium">
        © 2026 Harf Avcısı - Tüm Hakları Saklıdır. Tasarım ve Geliştirme: Berat Eren SEVİNDİ
      </footer>
    </div>
  )
}

export default App