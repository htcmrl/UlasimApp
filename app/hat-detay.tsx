import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { AnimatedRegion, Marker, Polyline } from 'react-native-maps';


// Veri dosyalarımızı çekiyoruz
import guzergahData from '../data/guzergahlar.json';
import hatCizgileriData from '../data/hat_cizgileri.json';
import osmaniyeData from '../data/osmaniye.json';

type DurakTipi = { stopId: string; stopName: string; lat: string; lng: string; };
type SaatlerTipi = { haftaici: string[]; cumartesi: string[]; pazar: string[]; };
type YonTipi = { yonAdi: string; duraklar: DurakTipi[]; saatler?: SaatlerTipi; };

//  Hat renklerini osmaniye.json'dan alıp hızlı bir sözlük yapıyoruz
const hatRenkleri: { [key: string]: string } = {};
if (osmaniyeData && osmaniyeData.routeList) {
    osmaniyeData.routeList.forEach((route) => {
        if (route.displayRouteCode && route.routeColor) {
            hatRenkleri[route.displayRouteCode] = route.routeColor.replace('#', '');
        }
    });
}

// AKTARMA HATLARINI BULAN FONKSİYON
const getGecenHatlar = (hedefStopId: string, mevcutHatKodu: string) => {
    const gecenHatlar: string[] = [];

    Object.keys(guzergahData).forEach((hatKodu) => {
        if (hatKodu === mevcutHatKodu) return;

        const yonler = (guzergahData as any)[hatKodu];

        if (Array.isArray(yonler)) {
            const duraktanGeciyorMu = yonler.some((yon: any) =>
                yon.duraklar && yon.duraklar.some((d: any) => String(d.stopId) === String(hedefStopId))
            );

            if (duraktanGeciyorMu) {
                gecenHatlar.push(hatKodu);
            }
        }
    });

    return gecenHatlar;
};

export default function HatDetayScreen() {
    const params = useLocalSearchParams();
    const routeCode = Array.isArray(params.routeCode) ? params.routeCode[0] : (params.routeCode as string || 'Bilinmiyor');
    const routeName = Array.isArray(params.routeName) ? params.routeName[0] : (params.routeName as string || 'Hat Detayı');
    let routeColor = Array.isArray(params.routeColor) ? params.routeColor[0] : (params.routeColor as string || '0a9fa4');

    routeColor = routeColor.replace('#', '');

    const [aktifYonIndex, setAktifYonIndex] = useState(0);
    const [yonler, setYonler] = useState<YonTipi[]>([]);
    const [modalGorunur, setModalGorunur] = useState(false);

    const [haritaGorunur, setHaritaGorunur] = useState(false);

    // -- OTOBÜS SİMÜLASYONU STATE'LERİ --
    const [otobusIndex, setOtobusIndex] = useState(0);

    // 🚌 KAYAN OTOBÜS MOTORU 
    const busCoordinate = useRef(
        new AnimatedRegion({
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        })
    ).current;

    // Yön değiştiğinde veya harita ilk açıldığında otobüsü başlangıç durağına "ışınla" (kaymadan gitsin)
    useEffect(() => {
        if (duraklar.length > 0) {

            // Sadece başlarına (busCoordinate as any) ekledik!
            (busCoordinate as any).timing({
                latitude: parseFloat(duraklar[0].lat),
                longitude: parseFloat(duraklar[0].lng),
                duration: 0,
                useNativeDriver: false,
            }).start();
        }
    }, [duraklar]);

    // otobusIndex her değiştiğinde (liste alt satıra geçtiğinde) otobüsü yeni durağa yumuşakça kaydır
    useEffect(() => {
        if (duraklar.length > 0 && duraklar[otobusIndex]) {
            (busCoordinate as any).timing({
                latitude: parseFloat(duraklar[otobusIndex].lat),
                longitude: parseFloat(duraklar[otobusIndex].lng),
                duration: 3000, // Otobüsün kayma süresi
                useNativeDriver: false,
            }).start();
        }
    }, [otobusIndex]);

    // 1. ÖNCE VERİYİ ÇEK VE HAZIRLA
    useEffect(() => {
        const seciliHat = (guzergahData as any)[routeCode];
        if (seciliHat && Array.isArray(seciliHat)) {
            setYonler(seciliHat);
            setAktifYonIndex(0);
            setOtobusIndex(0); // YENİ: Hat değişince otobüs başa dönsün
        } else {
            setYonler([]);
        }
    }, [routeCode]);

    const yonDegistir = () => {
        if (yonler.length > 1) {
            setAktifYonIndex((prevIndex) => (prevIndex === 0 ? 1 : 0));
            setOtobusIndex(0); // YENİ: Yön değişince otobüs başa dönsün
        }
    };

    // 2. DURAKLARI TANIMLA (Motor bundan beslenecek)
    const guncelYon = yonler[aktifYonIndex];
    const duraklar = guncelYon ? guncelYon.duraklar : [];
    const yonAdi = guncelYon ? guncelYon.yonAdi : "Güzergah Durakları";

    // 3. EN SON MOTORU KUR (Çünkü artık 'duraklar' kim biliyoruz)
    // -- OTOBÜS SİMÜLASYONU MOTORU (Timer) --
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // Eğer o yönde durak varsa motoru çalıştır
        if (duraklar && duraklar.length > 0) {
            timer = setInterval(() => {
                setOtobusIndex((prevIndex) => {
                    // Eğer otobüs son durağa geldiyse, tekrar başa (0. durağa) dönsün
                    if (prevIndex >= duraklar.length - 1) {
                        return 0;
                    }
                    // Gelmediyse bir alt durağa insin
                    return prevIndex + 1;
                });
            }, 3000); // 3000 milisaniye = 3 saniye (Hızını buradan ayarlayabilirsin)
        }

        // Sayfadan çıkınca veya yön değişince motoru temizle (Memory leak olmasın)
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [duraklar]); // Duraklar değiştiğinde (yön değiştiğinde) motor yeniden başlar



    const renderItem = ({ item, index }: { item: DurakTipi; index: number }) => {
        const gecenHatlar = getGecenHatlar(item.stopId, routeCode);

        // Otobüsün index'i, şu an ekrana çizilen durağın index'ine eşit mi?
        const otobusBuradaMi = index === otobusIndex;

        return (
            <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Text style={styles.iconText}>🚏</Text>
                </View>

                {/* flex: 1 sayesinde bu kısım ekranı doldurur, sağdaki ikonu iter */}
                <View style={styles.nameContainer}>
                    <Text style={styles.nameText}>
                        {item.stopName}
                    </Text>

                    {/* Aktarma Rozetleri */}
                    {gecenHatlar.length > 0 && (
                        <View style={styles.badgeContainer}>
                            {gecenHatlar.map((hat, i) => {
                                const orjinalRenk = hatRenkleri[hat] || '888888';
                                return (
                                    <View
                                        key={i}
                                        style={[styles.badge, { borderColor: `#${orjinalRenk}`, backgroundColor: `#${orjinalRenk}1A` }]}
                                    >
                                        <Text style={[styles.badgeText, { color: `#${orjinalRenk}` }]}>
                                            {hat}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* SADECE OTOBÜS İKONU - Kartın en sağına sabitlendi */}
                {otobusBuradaMi && (
                    <View style={{ justifyContent: 'center', paddingLeft: 10 }}>
                        <Text style={{ fontSize: 22 }}>🚌</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.safeArea}>
            <View style={styles.container}>

                <View style={[styles.headerBox, { backgroundColor: `#${routeColor}` }]}>
                    <Text style={styles.headerCode}>{routeCode}</Text>
                    <Text style={styles.headerName}>{routeName}</Text>
                </View>

                <View style={styles.yonContainer}>
                    <Text style={styles.yonTitle} numberOfLines={1}>{yonAdi}</Text>

                    <View style={{ flexDirection: 'row', gap: 2 }}>
                        {/*  Harita Butonu */}
                        <TouchableOpacity
                            style={[styles.yonButon, { backgroundColor: '#0a9fa4' }]}
                            onPress={() => setHaritaGorunur(true)}
                        >
                            <Text style={styles.yonButonText}>🗺️Harita</Text>
                        </TouchableOpacity>

                        {/* Saat Butonu */}
                        <TouchableOpacity
                            style={[styles.yonButon, { backgroundColor: '#FF9800' }]}
                            onPress={() => setModalGorunur(true)}
                        >
                            <Text style={styles.yonButonText}>🕒Saatler</Text>
                        </TouchableOpacity>

                        {yonler.length > 1 && (
                            <TouchableOpacity style={styles.yonButon} onPress={yonDegistir}>
                                <Text style={styles.yonButonText}>🔄Yön</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {duraklar.length > 0 ? (
                    <FlatList
                        data={duraklar}
                        keyExtractor={(item, index) => item.stopId ? item.stopId.toString() : index.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Bu hat için henüz durak verisi eklenmedi.</Text>
                    </View>
                )}
            </View>

            {/* Saat Listeleme Modalı */}
            <Modal visible={modalGorunur} animationType="fade" transparent={true}>
                <View style={styles.modalMerkez}>
                    <View style={styles.modalIcerik}>
                        <Text style={styles.modalBaslik}>🕒 {routeCode} Saatleri</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {['haftaici', 'cumartesi', 'pazar'].map((gun) => (
                                <View key={gun} style={styles.saatBolumu}>
                                    <Text style={styles.gunAdi}>
                                        {gun === 'haftaici' ? 'Hafta İçi' : gun === 'cumartesi' ? 'Cumartesi' : 'Pazar'}
                                    </Text>
                                    <View style={styles.saatGrid}>
                                        {guncelYon?.saatler?.[gun as keyof SaatlerTipi]?.length ? (
                                            guncelYon.saatler[gun as keyof SaatlerTipi].map((saat, i) => (
                                                <View key={i} style={styles.saatBadge}>
                                                    <Text style={styles.saatText}>{saat}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.yokText}>Bilinmiyor</Text>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.kapatButon}
                            onPress={() => setModalGorunur(false)}
                        >
                            <Text style={styles.kapatButonText}>Kapat</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/*  HARİTA MODALI */}
            <Modal visible={haritaGorunur} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={{ padding: 15, backgroundColor: `#${routeColor}`, flexDirection: 'row', alignItems: 'center', paddingTop: 50 }}>
                        <TouchableOpacity onPress={() => setHaritaGorunur(false)} style={{ padding: 10 }}>
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Geri           </Text>
                        </TouchableOpacity>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, marginLeft: 20 }}>
                            {routeCode} Güzergahı
                        </Text>
                    </View>

                    {duraklar.length > 0 && (
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: parseFloat(duraklar[0].lat),
                                longitude: parseFloat(duraklar[0].lng),
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }}
                        >
                            {/* Rotayı Çizen Çizgi (Polyline) */}
                            <Polyline
                                // YENİ: Artık dümdüz durakları değil, yeni JSON dosyasındaki binlerce kıvrım noktasını okuyor!
                                // routeCode (Örn: YBO1) ve aktifYonIndex (0 veya 1) ile tam o anki yönün haritasını buluruz.
                                coordinates={
                                    (hatCizgileriData as any)[routeCode] && (hatCizgileriData as any)[routeCode][aktifYonIndex]
                                        ? (hatCizgileriData as any)[routeCode][aktifYonIndex]
                                        : [] // Eğer veri yoksa boş çiz (çökmesin)
                                }
                                strokeColor={`#${routeColor}`}
                                strokeWidth={4} // Çizgi kalınlığı
                                lineJoin="round" // Köşeleri yumuşak döner
                            />


                            {/* Durak İkonları */}
                            {duraklar.map((durak, index) => (
                                <Marker
                                    key={durak.stopId ? durak.stopId.toString() : index.toString()}
                                    coordinate={{
                                        latitude: parseFloat(durak.lat),
                                        longitude: parseFloat(durak.lng)
                                    }}
                                    title={durak.stopName}
                                >
                                    {/* ÖZEL İKON VE BOYUT AYARI */}
                                    <Image
                                        source={require('../assets/images/durak-icon.png')} // ikonunun dosya yolu
                                        style={{
                                            width: 25,   // İkonun genişliği Büyütmek için 35-40 
                                            height: 25,  // İkonun yüksekliği
                                            resizeMode: 'contain' // Görüntünün bozulmasını engeller
                                        }}
                                    />
                                </Marker>
                            ))}

                            {/* 🚌 YENİ: HARİTADA HAREKET EDEN OTOBÜS İKONU */}
                            {/* otobusIndex değiştikçe bu markör otomatik olarak yeni durağın koordinatına zıplar */}
                            {duraklar.length > 0 && duraklar[otobusIndex] && (
                                <Marker.Animated
                                    coordinate={busCoordinate as any}
                                    title="Otobüs Şu An Burada"
                                    zIndex={999} // Diğer tüm durakların ve çizgilerin üstünde görünsün
                                >
                                    <View style={{
                                        backgroundColor: 'white',
                                        padding: 6,
                                        borderRadius: 20,
                                        borderWidth: 2,
                                        borderColor: '#FF9800', // Dikkat çekici turuncu çerçeve
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.5,
                                        elevation: 5
                                    }}>
                                        <Text style={{ fontSize: 20 }}>🚌</Text>
                                    </View>
                                </Marker.Animated>
                            )}

                        </MapView>
                    )}
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
    headerBox: { padding: 20, borderRadius: 15, alignItems: 'center', marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
    headerCode: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 5 },
    headerName: { fontSize: 16, color: 'white', fontWeight: '600', textAlign: 'center' },
    yonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    yonTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    yonButon: { backgroundColor: '#0a9fa4', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, minWidth: 70, alignItems: 'center' },
    yonButonText: { color: 'white', fontSize: 13, fontWeight: 'bold' },
    listContainer: { paddingBottom: 30 },
    card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, padding: 15, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    iconContainer: { width: 40, height: 40, backgroundColor: '#E8F4F8', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    iconText: { fontSize: 20 },
    nameContainer: { flex: 1, justifyContent: 'center' },
    nameText: { fontSize: 15, fontWeight: '600', color: '#333' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, color: '#888', fontStyle: 'italic', textAlign: 'center' },

    badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },

    modalMerkez: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalIcerik: { width: '85%', maxHeight: '70%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 10 },
    modalBaslik: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    saatBolumu: { marginBottom: 15 },
    gunAdi: { fontSize: 14, fontWeight: 'bold', color: '#0a9fa4', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4 },
    saatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    saatBadge: { backgroundColor: '#f0f0f0', paddingVertical: 4, borderRadius: 6, width: '23%', alignItems: 'center', marginBottom: 4 },
    saatText: { fontSize: 12, fontWeight: '600', color: '#444' },
    yokText: { fontSize: 12, color: '#999', fontStyle: 'italic' },
    kapatButon: { marginTop: 15, backgroundColor: '#333', padding: 12, borderRadius: 10, alignItems: 'center' },
    kapatButonText: { color: 'white', fontWeight: 'bold' },
});