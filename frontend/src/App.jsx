import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

function App() {
  const [harf, setHarf] = useState("?");
  const [isSpinning, setIsSpinning] = useState(false);
  const [cevaplar, setCevaplar] = useState({
    isim: '', sehir: '', hayvan: '', bitki: '', esya: ''
  });
  // 1. Yeni State: Backend'den gelen doğrulama sonuçlarını tutar
  const [sonuclar, setSonuclar] = useState({});
  const [gecmis, setGecmis] = useState([]); // [{ harf: 'A', puan: 40 }, ...]

  const [sure, setSure] = useState(90); // Oyun süresi (saniye)
  const [oyunBasladi, setOyunBasladi] = useState(false);
  const timerRef = useRef(null); // Sayacı kontrol etmek için
  const [loading, setLoading] = useState(false);

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
    // Harf seçildiğinde sayaç başlasın
    setSure(90); 
    setOyunBasladi(true);
  };

  const puanla = async () => {
    // Yüklemeyi başlat
    setLoading(true);
    // Sayaçı durdur ve oyun durumunu kapat
    clearInterval(timerRef.current);
    setOyunBasladi(false);

    try {
      const response = await axios.post('http://localhost:5269/api/game/validate', {
        selectedLetter: harf,
        answers: cevaplar
      }, { timeout: 15000 }); // 15 saniye timeout

      const { totalScore, validations } = response.data;
      
      // Backend'den gelen doğruları/yanlışları state'e kaydet
      setSonuclar(validations); 
      setGecmis(prev => [{ harf: harf, puan: totalScore }, ...prev].slice(0, 5)); // Son 5 skoru tutar
      
      alert(`Oyun bitti! Toplam Puanın: ${totalScore}`);
    } catch (error) {
      console.error("Hata Detayı:", error.response ? error.response.data : error.message);
      alert(`Backend uykuda mı? Hata oluştu: ${error.message}`);
    } finally {
      // Her durumda yüklemeyi bitir
      setLoading(false);
    }
  };

  // Sayaç mantığı: oyun başladığında saniyeyi azalt, 0 olduğunda otomatik puanla
  useEffect(() => {
    if (oyunBasladi && sure > 0) {
      timerRef.current = setInterval(() => {
        setSure((prev) => prev - 1);
      }, 1000);
    } else if (sure === 0) {
      clearInterval(timerRef.current);
      // sure bittiyse puanla
      puanla();
      setOyunBasladi(false);
    }

    return () => clearInterval(timerRef.current);
  }, [oyunBasladi, sure]);

  // Süreyi biçimlendiren yardımcı fonksiyon
  const formatSure = (saniye) => {
    const dk = Math.floor(saniye / 60);
    const sn = saniye % 60;
    return `${dk}:${sn < 10 ? '0' + sn : sn}`;
  };

  return (
    <div className="h-screen bg-gradient-to-b from-slate-900 to-black flex flex-row items-center justify-center p-6 font-sans text-slate-100 overflow-hidden gap-12">
      
      {/* SOL TARAF: ANA OYUN ALANI - max-w-2xl -> max-w-xl (İdeal genişlik) */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl"> 
        <div className="text-center mb-4">
            <h1 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-lg">
              HARF <span className="text-yellow-400">AVCISI</span>
            </h1>
          </div>

          <div className={`text-6xl font-mono font-black mb-4 transition-all duration-500 ${sure <= 15 ? 'text-red-600 animate-pulse scale-105' : 'text-yellow-400'}`}>
            {formatSure(sure)}
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full border-4 border-yellow-400 flex flex-col gap-4">
            
            {/* Harf Alanı - text-8xl -> text-7xl */}
            <div className="flex flex-col items-center">
              <div className={`text-7xl font-black mb-2 transition-all duration-300 ${isSpinning ? 'animate-bounce scale-110' : 'scale-100 text-indigo-600'}`}>
                {harf}
              </div>
              <button 
                  onClick={harfSec}
                  disabled={isSpinning}
                  className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-2 px-6 rounded-full shadow-md transform active:scale-95 transition-all disabled:opacity-50 text-base"
                >
                  {harf === "?" ? "HARFİ YAKALA!" : "YENİ HARF SEÇ"}
                </button>
            </div>

            <div className="space-y-2">
              {kategoriler.map((kat) => (
                <div key={kat.id}>
                  <label className="text-xs font-bold text-indigo-800 ml-1 mb-0.5 block uppercase tracking-wider">
                    {kat.icon} {kat.label}
                  </label>
                  <input 
                    type="text" 
                    className={`w-full border-2 rounded-lg py-2.5 px-4 outline-none transition-all font-semibold text-sm ${
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
                className={`w-full mt-2 font-black py-3.5 rounded-xl shadow-lg transform transition-all active:scale-95 text-lg uppercase tracking-widest ${loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                onClick={puanla}
                disabled={loading || harf === "?"}
              >
                {loading ? "Ai İNCELİYOR..." : "PUANLA"}
              </button>
          </div>
      </div>

      {/* SAĞ TARAF: GEÇMİŞ SKORLAR PANELİ - w-96 -> w-80 */}
      <div className="w-80 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-yellow-400 border-b-2 border-yellow-400/30 pb-2 flex items-center gap-2">
          <span>📜</span> SON AVLAR
        </h2>
        
        <div className="flex flex-col gap-3">
          {gecmis.length === 0 ? (
            <p className="text-slate-500 italic text-base text-center mt-6">Henüz avlanma yapılmadı...</p>
          ) : (
            gecmis.map((item, index) => (
              <div 
                key={index} 
                className="bg-slate-800/60 border-2 border-slate-700 p-4 rounded-2xl flex justify-between items-center transform transition-all hover:scale-105"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Harf</span>
                  <span className="text-3xl font-black text-indigo-400 leading-none">{item.harf}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Puan</span>
                  <div className="text-3xl font-black text-green-400 leading-none">{item.puan}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}

export default App