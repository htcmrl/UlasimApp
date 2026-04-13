// Dereceyi radyana çeviren küçük matematiksel yardımcı
const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

// Asıl Haversine Formülü (İki koordinat arası mesafeyi KM cinsinden verir)
export const mesafeHesaplaKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Dünyanın yarıçapı (Kilometre)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Mesafe (KM)

    return d;
};

// Tüm durakları tarayıp bize en yakın N tane durağı veren Ana Fonksiyon
export const enYakinDuraklariBul = (
    kullaniciLat: number,
    kullaniciLng: number,
    tumDuraklar: any[],
    limit: number = 3
) => {
    // 1. Her durak için mesafeyi hesapla ve durağın içine 'mesafe' bilgisini ekle
    const duraklarMesafeli = tumDuraklar.map(durak => {
        const mesafe = mesafeHesaplaKm(
            kullaniciLat,
            kullaniciLng,
            parseFloat(durak.lat),
            parseFloat(durak.lng)
        );
        return {
            ...durak,
            mesafe: mesafe
        };
    });

    // 2. Mesafeye göre küçükten büyüğe (yakından uzağa) sırala
    duraklarMesafeli.sort((a, b) => a.mesafe - b.mesafe);

    // 3. Sadece en baştaki (en yakın) 'limit' kadar durağı kes ve gönder
    return duraklarMesafeli.slice(0, limit);
};