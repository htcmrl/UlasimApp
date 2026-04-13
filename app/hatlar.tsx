import { Stack, useRouter } from 'expo-router'; //  Yönlendirme için eklendi
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Ana dizindeki data klasöründen JSON dosyamızı çağırıyoruz
// (Eğer dosya yolunda hata verirse '../data/osmaniye.json' kısmındaki noktaları ayarlayabiliriz)
import osmaniyeData from '../data/osmaniye.json';

// Hat verimizin yapısını tanımlıyoruz
type HatTipi = {
    routeCode: string;
    displayRouteCode: string;
    name: string;
    routeColor: string;
};

export default function HatlarScreen() {
    const router = useRouter(); // YENİ: Yönlendiriciyi başlattık
    // JSON'un içindeki routeList (Hatlar) dizisini bir değişkene atıyoruz
    const hatlar = osmaniyeData.routeList;

    // FlatList'in ekrana basacağı her bir satırın (hattın) tasarımı
    const renderItem = ({ item }: { item: HatTipi }) => {

        // YENİ: Renk ayarlarımızı burada yapıyoruz
        const orjinalRenk = `#${item.routeColor || '0a9fa4'}`;
        const acikArkaPlan = `${orjinalRenk}25`;

        return (
            <TouchableOpacity
                // YENİ: Kartın arka planına açık pastel rengi veriyoruz
                style={[styles.card, { backgroundColor: acikArkaPlan }]}

                // YENİ: Tıklandığında hat-detay sayfasına hattın bilgilerini parametre olarak gönderiyoruz
                onPress={() => router.push({
                    pathname: '/hat-detay',
                    params: {
                        routeCode: item.displayRouteCode,
                        routeName: item.name,
                        routeColor: item.routeColor
                    }
                })}
            >
                {/* Sol taraf: Hattın Kodu (A1, A2 vs.) ve kendi rengi */}
                <View style={styles.codeContainer}>
                    <Text style={[styles.codeText, { color: orjinalRenk }]}>{item.displayRouteCode}</Text>
                </View>

                {/* Sağ taraf: Hattın Adı (MEVLANA-HASTANE vs.) */}
                <View style={styles.nameContainer}>
                    <Text style={styles.nameText}>{item.name}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (

        <View style={styles.safeArea}>
            {/* ÜST BAR AYARI */}
            <Stack.Screen
                options={{
                    headerBackTitle: 'Geri', // Veya 'Ana Sayfa'
                }}
            />


            <View style={styles.container}>
                <Text style={styles.headerTitle}>Otobüs Hatları</Text>

                {/* Verileri listelediğimiz ana bileşen */}
                <FlatList
                    data={hatlar} // Hangi diziyi listeleyeceğiz?
                    keyExtractor={(item) => item.routeCode} // Her elemanın benzersiz kimliği
                    renderItem={renderItem} // Ekrana nasıl çizeceğiz? (Yukarıdaki fonksiyon)
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false} // Sağdaki kaydırma çubuğunu gizler
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 30, // En alttaki eleman dibe yapışmasın
    },
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        marginBottom: 12,
        // Pastel arka planda gölge kullanmıyoruz, sildik.
    },
    codeContainer: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRightWidth: 1, // Kodu ve ismi ayıran çok şık ince bir dikey çizgi
        borderRightColor: 'rgba(0,0,0,0.06)',
    },
    codeText: {
        fontSize: 22,
        fontWeight: '900',
    },
    nameContainer: {
        flex: 1, // Kalan tüm boşluğu kapla
        justifyContent: 'center',
        paddingHorizontal: 15,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
    },
});
