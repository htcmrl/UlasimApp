const fs = require('fs');
const path = require('path');

const guzergahlarYolu = path.join(__dirname, 'data', 'guzergahlar.json');
const ciktiYolu = path.join(__dirname, 'data', 'hat_cizgileri.json');

const guzergahlarData = JSON.parse(fs.readFileSync(guzergahlarYolu, 'utf-8'));

// YENİ: Diğer hatların silinmemesi için eski dosyayı hafızaya alıyoruz
let butunHatCizgileri = {};
if (fs.existsSync(ciktiYolu)) {
    butunHatCizgileri = JSON.parse(fs.readFileSync(ciktiYolu, 'utf-8'));
}

async function rotalariOlustur() {
    console.log("SADECE A9 HATTI için operasyon başlıyor...\n");

    for (const hatKodu of Object.keys(guzergahlarData)) {

        // YENİ: Sadece A9'a odaklan, diğerlerini atla (Zaman tasarrufu)
        if (hatKodu !== 'A9') continue;

        const yonler = guzergahlarData[hatKodu];
        if (!yonler || yonler.length === 0) continue;

        butunHatCizgileri[hatKodu] = []; // A9'un eski bozuk verisini sıfırla

        for (let i = 0; i < yonler.length; i++) {
            const yon = yonler[i];
            const hatDuraklari = yon.duraklar;

            if (!Array.isArray(hatDuraklari) || hatDuraklari.length < 2) {
                console.log(`⚠️ [${hatKodu}] -> ${yon.yonAdi} atlandı.`);
                butunHatCizgileri[hatKodu].push([]);
                continue;
            }

            const koordinatStringleri = hatDuraklari.map(durak => {
                return `${durak.lng},${durak.lat}`;
            });

            const osrmUrl = koordinatStringleri.join(';');

            // ESKİYE DÖNÜŞ: Toleransı tekrar 50 yaptık. 
            // 1. yön eski haline dönecek. 
            // 2. yön OSRM'de patlayıp bizim kuş bakışı yedeğe düşecek. (Tam istediğimiz gibi)
            const toleranslar = Array(hatDuraklari.length).fill(50).join(';');


            try {
                console.log(`[${hatKodu}] -> ${yon.yonAdi} için rota hesaplanıyor...`);

                const fetchUrl = `http://router.project-osrm.org/route/v1/driving/${osrmUrl}?geometries=geojson&overview=full&continue_straight=true&radiuses=${toleranslar}`;

                const response = await fetch(fetchUrl);
                const sonuc = await response.json();

                if (sonuc.code === 'Ok' && sonuc.routes.length > 0) {
                    const gercekCizgi = sonuc.routes[0].geometry.coordinates.map(koordinat => ({
                        latitude: koordinat[1],
                        longitude: koordinat[0]
                    }));

                    butunHatCizgileri[hatKodu].push(gercekCizgi);
                    console.log(`✅ Başarılı.`);
                } else {
                    // 🌟 İŞTE O MÜTHİŞ "AYNALAMA" HİLESİ 🌟
                    // Eğer A9'un 2. yönündeysek (i === 1) ve OSRM hata verdiyse;
                    // 1. yönün (başarılı olan) çizgisini kopyala, ters çevir ve dönüş rotası olarak kullan!
                    if (hatKodu === 'A9' && i === 1 && butunHatCizgileri[hatKodu][0] && butunHatCizgileri[hatKodu][0].length > 0) {
                        console.log(`😎 HARİTA HİLESİ: A9 Dönüş yönü için, Gidiş yönünün asfalttan giden çizgisi kopyalanıp aynalandı!`);

                        const kopyalanmisCizgi = [...butunHatCizgileri[hatKodu][0]].reverse();
                        butunHatCizgileri[hatKodu].push(kopyalanmisCizgi);
                    } else {
                        console.log(`⚠️ [${hatKodu}] -> OSRM bulamadı, YEDEK DÜZ ÇİZGİ devrede!`);
                        const yedekCizgi = hatDuraklari.map(d => ({
                            latitude: parseFloat(d.lat),
                            longitude: parseFloat(d.lng)
                        }));
                        butunHatCizgileri[hatKodu].push(yedekCizgi);
                    }
                }
            } catch (error) {
                console.error(`❌ [${hatKodu}] -> Hata oluştu, YEDEK DÜZ ÇİZGİ devrede:`, error.message);
                const yedekCizgi = hatDuraklari.map(d => ({
                    latitude: parseFloat(d.lat),
                    longitude: parseFloat(d.lng)
                }));
                butunHatCizgileri[hatKodu].push(yedekCizgi);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        console.log("--------------------------------------------------");
    }

    fs.writeFileSync(ciktiYolu, JSON.stringify(butunHatCizgileri, null, 2), 'utf-8');
    console.log(`\nİşlem tamamlandı. 'hat_cizgileri.json' güncellendi.`);
}

rotalariOlustur();