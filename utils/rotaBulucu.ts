export const dogrudanHatBul = (baslangicDuraklari: any[], hedefDuraklari: any[], guzergahData: any) => {
    const alternatifRotalar: any[] = [];

    // Hızlı arama yapabilmek için durak ID'lerini basit bir listeye (array) çeviriyoruz
    const baslangicIdleri = baslangicDuraklari.map(d => d.stopId.toString());
    const hedefIdleri = hedefDuraklari.map(d => d.stopId.toString());

    // guzergahlar.json'daki TÜM hatları (YBO1, A1, vb.) taramaya başlıyoruz
    Object.keys(guzergahData).forEach(hatKodu => {
        const yonler = guzergahData[hatKodu];

        // Her hattın yönlerini (0: Gidiş, 1: Dönüş) kendi içinde tarıyoruz
        yonler.forEach((yon: any, yonIndex: number) => {
            const duraklar = yon.duraklar;
            if (!duraklar) return;

            let binenDurakIndex = -1;
            let inenDurakIndex = -1;
            let binenDurakAd = "";
            let inenDurakAd = "";

            // 1. ADIM: Bu yönde bizim BAŞLANGIÇ duraklarımızdan biri var mı?
            for (let i = 0; i < duraklar.length; i++) {
                if (baslangicIdleri.includes(duraklar[i].stopId.toString())) {
                    binenDurakIndex = i; // Bindiği sırayı kaydet
                    binenDurakAd = duraklar[i].stopName;
                    break; // İlk bulduğumuz durağı cebe atıp döngüden çıkıyoruz
                }
            }

            // 2. ADIM: Eğer bineceğimiz durağı bulduysak, HEDEF durağı var mı diye bakıyoruz.
            // DİKKAT: Aramaya bindiğimiz duraktan SONRAKİ (binenDurakIndex + 1) duraklardan başlıyoruz!
            if (binenDurakIndex !== -1) {
                for (let j = binenDurakIndex + 1; j < duraklar.length; j++) {
                    if (hedefIdleri.includes(duraklar[j].stopId.toString())) {
                        inenDurakIndex = j; // İneceği sırayı kaydet
                        inenDurakAd = duraklar[j].stopName;
                        break;
                    }
                }
            }

            // 3. ADIM: Hem biniş hem iniş durağı bulunduysa (Kesişim Başarılı!)
            if (binenDurakIndex !== -1 && inenDurakIndex !== -1) {
                alternatifRotalar.push({
                    hatKodu: hatKodu,               // Örn: "YBO1"
                    yonAdi: yon.yonAdi,             // Örn: "Üniversite - Otogar"
                    yonIndex: yonIndex,             // Haritada o kıvrımlı çizgiyi çizerken bize lazım olacak (0 veya 1)
                    binilecekDurak: binenDurakAd,
                    inilecekDurak: inenDurakAd,
                    kacDurakGidecek: inenDurakIndex - binenDurakIndex // En kısa rotayı bulmak için durak farkı
                });
            }
        });
    });

    // Kullanıcıya en az durak geçerek (en hızlı) ulaşabileceği rotaları en üstte gösterelim
    alternatifRotalar.sort((a, b) => a.kacDurakGidecek - b.kacDurakGidecek);

    return alternatifRotalar;
};

// --- YENİ EKLENEN: AKTARMALI HAT BULMA MOTORU ---
export const aktarmaliHatBul = (baslangicDuraklari: any[], hedefDuraklari: any[], guzergahData: any) => {
    const aktarmaliRotalar: any[] = [];
    const baslangicIdleri = baslangicDuraklari.map(d => d.stopId.toString());
    const hedefIdleri = hedefDuraklari.map(d => d.stopId.toString());

    // ADIM 1: Başlangıçtan geçen ve Hedefe giden BÜTÜN hatları ayrı ayrı havuzlara topluyoruz.
    const baslangicHatlar: any[] = [];
    const hedefHatlar: any[] = [];

    Object.keys(guzergahData).forEach(hatKodu => {
        const yonler = guzergahData[hatKodu];
        yonler.forEach((yon: any, yonIndex: number) => {
            const duraklar = yon.duraklar;
            if (!duraklar) return;

            // Bu hat başlangıç duraklarımızdan birinden geçiyor mu?
            for (let i = 0; i < duraklar.length; i++) {
                if (baslangicIdleri.includes(duraklar[i].stopId.toString())) {
                    baslangicHatlar.push({ hatKodu, yonAdi: yon.yonAdi, yonIndex, binenIndex: i, binenAd: duraklar[i].stopName, duraklar });
                    break; // Bulduğumuz an çıkıyoruz
                }
            }

            // Bu hat hedef duraklarımızdan birinden geçiyor mu?
            for (let i = 0; i < duraklar.length; i++) {
                if (hedefIdleri.includes(duraklar[i].stopId.toString())) {
                    hedefHatlar.push({ hatKodu, yonAdi: yon.yonAdi, yonIndex, inenIndex: i, inenAd: duraklar[i].stopName, duraklar });
                    break;
                }
            }
        });
    });

    // ADIM 2: Kesişim (Aktarma) Noktalarını Bulmak İçin Çarpıştır!
    baslangicHatlar.forEach(basHat => {
        hedefHatlar.forEach(hedHat => {
            // Eğer iki hat tamamen aynıysa zaten aktarmasız gidiliyordur, bunu atla.
            if (basHat.hatKodu === hedHat.hatKodu && basHat.yonIndex === hedHat.yonIndex) return;

            // İlk otobüsün "Bindiği duraktan SONRAKİ" duraklarına bakıyoruz
            for (let i = basHat.binenIndex + 1; i < basHat.duraklar.length; i++) {
                const aktarmaDurakId = basHat.duraklar[i].stopId.toString();

                // İkinci otobüsün "İneceği duraktan ÖNCEKİ" duraklarına bakıyoruz
                for (let j = 0; j < hedHat.inenIndex; j++) {

                    // EŞLEŞME (KESİŞİM) BULUNDU MU?!
                    if (hedHat.duraklar[j].stopId.toString() === aktarmaDurakId) {

                        aktarmaliRotalar.push({
                            // 1. Otobüs
                            ilkHatKodu: basHat.hatKodu,
                            ilkYonAdi: basHat.yonAdi,
                            ilkYonIndex: basHat.yonIndex,
                            binilecekDurak: basHat.binenAd,

                            // Aktarma Noktası
                            aktarmaDuragi: basHat.duraklar[i].stopName,

                            // 2. Otobüs
                            ikinciHatKodu: hedHat.hatKodu,
                            ikinciYonAdi: hedHat.yonAdi,
                            ikinciYonIndex: hedHat.yonIndex,
                            inilecekDurak: hedHat.inenAd,

                            // Optimizasyon için toplam kaç durak gidilecek?
                            toplamDurak: (i - basHat.binenIndex) + (hedHat.inenIndex - j)
                        });

                        // İki hat arasında bir tane mantıklı aktarma bulduysak, iç döngüyü bitir (gereksiz kasmamak için)
                        break;
                    }
                }
            }
        });
    });

    // ADIM 3: Kullanıcıyı yormamak için en az durak geçilen (En Hızlı) rotaları en üste diziyoruz.
    aktarmaliRotalar.sort((a, b) => a.toplamDurak - b.toplamDurak);

    return aktarmaliRotalar; // Sonucu fırlat!
};