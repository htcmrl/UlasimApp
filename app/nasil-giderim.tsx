import { Stack } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

// 1. Veri ve Alet Çantalarımız
import guzergahData from '../data/guzergahlar.json';
import hatCizgileriData from '../data/hat_cizgileri.json'; // YENİ: 57 bin satırlık harita verimiz!
import osmaniyeData from '../data/osmaniye.json';
import { enYakinDuraklariBul } from '../utils/mesafeHesapla';
import { aktarmaliHatBul, dogrudanHatBul } from '../utils/rotaBulucu';

// Hat renklerini ayarlamak için sözlük (Rozetler ve Çizgiler rengarenk olsun diye)
const hatRenkleri: { [key: string]: string } = {};
if (osmaniyeData && osmaniyeData.routeList) {
    osmaniyeData.routeList.forEach((route) => {
        if (route.displayRouteCode && route.routeColor) {
            hatRenkleri[route.displayRouteCode] = route.routeColor.replace('#', '');
        }
    });
}

export default function NasilGiderimScreen() {
    const mapRef = useRef<MapView>(null);
    const duraklar = osmaniyeData.stopList;

    // --- STATE'LER ---
    // Konumlar
    const [baslangicKonum, setBaslangicKonum] = useState<{ latitude: number; longitude: number } | null>(null);
    const [hedefKonum, setHedefKonum] = useState<{ latitude: number; longitude: number } | null>(null);
    const [bulunanRotalar, setBulunanRotalar] = useState<any[]>([]);

    // Arama Çubuğu State'leri
    const [aramaNereden, setAramaNereden] = useState("");
    const [aramaNereye, setAramaNereye] = useState("");
    const [aktifArama, setAktifArama] = useState<'nereden' | 'nereye' | null>(null);
    const [aramaSonuclari, setAramaSonuclari] = useState<any[]>([]);

    // Harita Çizgi State'i
    const [cizilecekRota, setCizilecekRota] = useState<{ koordinatlar: any[], renk: string } | null>(null);

    // --- YENİ EKLENEN STATE ---
    // Eğer bulunan rotalar aktarmalıysa bunu ekranda farklı çizmek için tuttuğumuz bilgi.
    const [aktarmaGerekli, setAktarmaGerekli] = useState(false);

    // --- ANA ROTA HESAPLAMA FONKSİYONU (GÜNCELLENDİ) ---
    const rotalariHesapla = (basLat: number, basLng: number, hedLat: number, hedLng: number) => {
        const baslangicAdaylari = enYakinDuraklariBul(basLat, basLng, duraklar, 3);
        const hedefAdaylari = enYakinDuraklariBul(hedLat, hedLng, duraklar, 3);

        // Önce doğrudan giden bir hat var mı diye soruyoruz
        const direktRotalar = dogrudanHatBul(baslangicAdaylari, hedefAdaylari, guzergahData);

        if (direktRotalar.length > 0) {
            setBulunanRotalar(direktRotalar);
            setAktarmaGerekli(false); // Doğrudan gidiliyor
        } else {
            // Direkt yoksa, yeni Aktarma dedektifimizi çağırıyoruz!
            const aktarmali = aktarmaliHatBul(baslangicAdaylari, hedefAdaylari, guzergahData);

            // Eğer aktarmalı rota da yoksa (çok düşük ihtimal ama), listeyi boşalt.
            // Sadece en iyi 5 aktarma alternatifini göster (liste uzamasın diye)
            setBulunanRotalar(aktarmali.slice(0, 5));
            setAktarmaGerekli(true); // Aktarma yapıldığını sayfaya bildiriyoruz
        }

        setCizilecekRota(null); // Yeni arama yapılınca eski çizgiyi sil
    };

    // --- HARİTAYA TIKLAMA MANTIĞI ---
    const haritayaTiklandi = (e: any) => {
        Keyboard.dismiss(); // Klavyeyi kapat
        setAktifArama(null); // Arama listesini gizle

        const { latitude, longitude } = e.nativeEvent.coordinate;

        if (!baslangicKonum || (baslangicKonum && hedefKonum)) {
            setBaslangicKonum({ latitude, longitude });
            setHedefKonum(null);
            setBulunanRotalar([]);
            setCizilecekRota(null);
            setAramaNereden("Haritadan Seçildi 📍");
            setAramaNereye("");
        } else if (baslangicKonum && !hedefKonum) {
            setHedefKonum({ latitude, longitude });
            setAramaNereye("Haritadan Seçildi 📍");
            rotalariHesapla(baslangicKonum.latitude, baslangicKonum.longitude, latitude, longitude);
        }
    };

    // --- Türkçe Karakter Düzleştirici ---
    const turkceKarakterTemizle = (text: string) => {
        if (!text) return "";
        return text
            .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
            .replace(/I/g, 'i').replace(/İ/g, 'i').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .toLowerCase();
    };

    // --- ARAMA ÇUBUĞU MANTIĞI (GÜNCELLENDİ) ---
    const metinAra = (metin: string, tip: 'nereden' | 'nereye') => {
        tip === 'nereden' ? setAramaNereden(metin) : setAramaNereye(metin);
        setAktifArama(tip);

        if (metin.length > 2) {
            // Hem yazılan metni hem de aranacak durak isimlerini düz İngilizceye çevirip karşılaştırıyoruz
            const arananTemiz = turkceKarakterTemizle(metin);

            const sonuclar = duraklar.filter(d => {
                const durakTemiz = turkceKarakterTemizle(d.name);
                return durakTemiz.includes(arananTemiz);
            });

            setAramaSonuclari(sonuclar.slice(0, 5)); // Sadece ilk 5 sonucu göster
        } else {
            setAramaSonuclari([]);
        }
    };

    const listedenDurakSec = (durak: any) => {
        const lat = parseFloat(durak.lat);
        const lng = parseFloat(durak.lng);

        if (aktifArama === 'nereden') {
            setBaslangicKonum({ latitude: lat, longitude: lng });
            setAramaNereden(durak.name);
            if (hedefKonum) rotalariHesapla(lat, lng, hedefKonum.latitude, hedefKonum.longitude);
        } else {
            setHedefKonum({ latitude: lat, longitude: lng });
            setAramaNereye(durak.name);
            if (baslangicKonum) rotalariHesapla(baslangicKonum.latitude, baslangicKonum.longitude, lat, lng);
        }

        setAktifArama(null);
        setAramaSonuclari([]);
        Keyboard.dismiss();

        // Haritayı seçilen durağa kaydır
        mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 1000);
    };

    // --- ROTA KARTINA TIKLAYINCA ÇİZGİ ÇİZME ---
    const rotayiHaritadaCiz = (rota: any) => {
        const hatVerisi = (hatCizgileriData as any)[rota.hatKodu];
        if (hatVerisi && hatVerisi[rota.yonIndex]) {
            const koordinatlar = hatVerisi[rota.yonIndex];
            const orjinalRenk = hatRenkleri[rota.hatKodu] || '0a9fa4';

            setCizilecekRota({
                koordinatlar: koordinatlar,
                renk: orjinalRenk
            });

            // Harita Kamerasını Otomatik Olarak Çizgiye Odakla (Büyü burada)
            mapRef.current?.fitToCoordinates(koordinatlar, {
                edgePadding: { top: 150, right: 50, bottom: 250, left: 50 },
                animated: true,
            });
        }
    };

    const haritayiTemizle = () => {
        setBaslangicKonum(null); setHedefKonum(null); setBulunanRotalar([]); setCizilecekRota(null);
        setAramaNereden(""); setAramaNereye(""); setAramaSonuclari([]); setAktifArama(null);
        setAktarmaGerekli(false); // YENİ: Bunu da sıfırlıyoruz.
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerBackTitle: 'Geri' }} />

            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{ latitude: 37.0745, longitude: 36.2475, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
                showsTraffic={true} showsBuildings={true} onPress={haritayaTiklandi}
            >
                {/* YENİ: Gerçek Yol Çizgisi (Polyline) */}
                {cizilecekRota && (
                    <Polyline
                        coordinates={cizilecekRota.koordinatlar}
                        strokeColor={`#${cizilecekRota.renk}`}
                        strokeWidth={5}
                        lineJoin="round"
                    />
                )}

                {/* Başlangıç ve Hedef Raptiyeleri */}
                {baslangicKonum && <Marker coordinate={baslangicKonum} title="Kalkış" pinColor="green" />}
                {hedefKonum && <Marker coordinate={hedefKonum} title="Varış" pinColor="red" />}
            </MapView>

            {/* ÜST ARAMA ÇUBUKLARI */}
            <View style={styles.topAramaKutusu}>
                <TextInput
                    style={styles.input}
                    placeholder="📍 Nereden (Durak yazın veya haritadan seçin)"
                    value={aramaNereden}
                    onChangeText={(text) => metinAra(text, 'nereden')}
                    onFocus={() => { setAktifArama('nereden'); setAramaSonuclari([]); }}
                />
                <View style={styles.ayiriciCizgi} />
                <TextInput
                    style={styles.input}
                    placeholder="🎯 Nereye (Durak yazın veya haritadan seçin)"
                    value={aramaNereye}
                    onChangeText={(text) => metinAra(text, 'nereye')}
                    onFocus={() => { setAktifArama('nereye'); setAramaSonuclari([]); }}
                />

                {(baslangicKonum || hedefKonum) && (
                    <TouchableOpacity style={styles.temizleButon} onPress={haritayiTemizle}>
                        <Text style={styles.temizleText}>Temizle</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ARAMA SONUÇLARI LİSTESİ (Arama yaparken altta açılır) */}
            {aktifArama && aramaSonuclari.length > 0 && (
                <View style={styles.aramaSonucKutusu}>
                    <ScrollView keyboardShouldPersistTaps="handled">
                        {aramaSonuclari.map((durak, index) => (
                            <TouchableOpacity key={index} style={styles.aramaSatiri} onPress={() => listedenDurakSec(durak)}>
                                <Text style={styles.aramaSatiriText}>🚏 {durak.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* ALT SONUÇ KARTI (Otobüs Önerileri) */}
            {hedefKonum && !aktifArama && (
                <View style={styles.bottomCard}>
                    <Text style={styles.cardTitle}>
                        {aktarmaGerekli ? "🔄 Aktarmalı Rotalar" : "🚌 Önerilen Rotalar"}
                    </Text>

                    {bulunanRotalar.length > 0 ? (
                        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                            {bulunanRotalar.map((rota, index) => {

                                // EĞER AKTARMALI BİR ROTA İSE BU KARTI ÇİZ
                                if (aktarmaGerekli) {
                                    const renk1 = hatRenkleri[rota.ilkHatKodu] || '0a9fa4';
                                    const renk2 = hatRenkleri[rota.ikinciHatKodu] || 'FF9800';

                                    return (
                                        <View key={index} style={[styles.rotaSatiri, { flexDirection: 'column', alignItems: 'stretch' }]}>
                                            {/* İlk Otobüs */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={[styles.hatRozeti, { backgroundColor: `#${renk1}`, paddingVertical: 4, paddingHorizontal: 8 }]}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{rota.ilkHatKodu}</Text>
                                                </View>
                                                <Text style={{ fontSize: 13, flex: 1 }}>Bin: <Text style={{ fontWeight: 'bold' }}>{rota.binilecekDurak}</Text></Text>
                                            </View>

                                            {/* Aktarma Noktası */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, paddingLeft: 10 }}>
                                                <Text style={{ fontSize: 18 }}>⬇️ </Text>
                                                <Text style={{ fontSize: 12, color: '#ff4757', fontWeight: 'bold' }}>Aktarma: {rota.aktarmaDuragi}</Text>
                                            </View>

                                            {/* İkinci Otobüs */}
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={[styles.hatRozeti, { backgroundColor: `#${renk2}`, paddingVertical: 4, paddingHorizontal: 8 }]}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>{rota.ikinciHatKodu}</Text>
                                                </View>
                                                <Text style={{ fontSize: 13, flex: 1 }}>İn: <Text style={{ fontWeight: 'bold' }}>{rota.inilecekDurak}</Text></Text>
                                            </View>
                                        </View>
                                    );
                                }

                                // EĞER DİREKT GİDİYORSA ESKİ (NORMAL) KARTI ÇİZ
                                const orjinalRenk = hatRenkleri[rota.hatKodu] || '0a9fa4';
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.rotaSatiri}
                                        onPress={() => rotayiHaritadaCiz(rota)} // TIKLAYINCA ÇİZGİYİ ÇİZER
                                    >
                                        <View style={[styles.hatRozeti, { backgroundColor: `#${orjinalRenk}` }]}>
                                            <Text style={styles.hatKodu}>{rota.hatKodu}</Text>
                                        </View>
                                        <View style={styles.rotaDetay}>
                                            <Text style={styles.rotaYonu}>{rota.yonAdi}</Text>
                                            <Text style={styles.durakBilgisi}>Bin: {rota.binilecekDurak}</Text>
                                            <Text style={styles.durakSayisi}>İn: {rota.inilecekDurak} ({rota.kacDurakGidecek} Durak)</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    ) : (
                        <Text style={styles.hataText}>Bu iki nokta arasında ulaşım rotası bulunamadı.</Text>
                    )}
                </View>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },

    // Arama Çubukları Stilleri
    topAramaKutusu: {
        position: 'absolute', top: 15, left: 15, right: 15, backgroundColor: 'white',
        borderRadius: 15, elevation: 8, padding: 10, shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, zIndex: 10
    },
    input: { height: 45, fontSize: 15, color: '#333', paddingHorizontal: 10 },
    ayiriciCizgi: { height: 1, backgroundColor: '#eee', marginVertical: 5 },
    temizleButon: { position: 'absolute', right: 15, top: 35, backgroundColor: '#ff4757', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    temizleText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    aramaSonucKutusu: {
        position: 'absolute', top: 125, left: 20, right: 20, backgroundColor: 'white',
        borderRadius: 10, elevation: 10, maxHeight: 200, zIndex: 11, shadowColor: '#000', shadowOpacity: 0.3
    },
    aramaSatiri: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    aramaSatiriText: { fontSize: 15, color: '#333' },

    // Alt Sonuç Kartı Stilleri
    bottomCard: {
        position: 'absolute', bottom: 30, left: 15, right: 15, backgroundColor: 'white',
        borderRadius: 20, padding: 15, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    rotaSatiri: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
    hatRozeti: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, marginRight: 15 },
    hatKodu: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    rotaDetay: { flex: 1 },
    rotaYonu: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 3 },
    durakBilgisi: { fontSize: 13, color: '#0a9fa4', fontWeight: '600' },
    durakSayisi: { fontSize: 12, color: '#888', marginTop: 2 },
    hataText: { fontSize: 14, color: '#ff4757', textAlign: 'center', fontStyle: 'italic', marginVertical: 10 }
});