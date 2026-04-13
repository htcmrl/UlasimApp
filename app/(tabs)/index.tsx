
// light: #A1CEDC  dark: #1D3D47  açık yeşil #B2D8B2  koyu mavi #1D3D47

/*
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';

// Anahtarı doğrudan 'process.env' üzerinden çekiyoruz
const GOOGLE_MAPS_APIKEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_APIKEY;

export default function HomeScreen() {
  const osmaniyeKoordinat = {
    latitude: 37.0745,     // Osmaniye merkez
    longitude: 36.2475,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const duraklar = [
    {
      id: 1,
      title: 'Üniversite 1',
      coordinate: { latitude: 37.044403, longitude: 36.225797 },
    },
    {
      id: 2,
      title: 'Üniversite 2',
      coordinate: { latitude: 37.044416, longitude: 36.225995 },
    },
    {
      id: 3,
      title: 'Fakıuşağı',
      coordinate: { latitude: 37.043142, longitude: 36.225046 },
    },
  ];

  // YENİ: Rota için başlangıç ve bitiş noktalarını tanımlayalım
  // Örnek olarak ilk durağı başlangıç, son durağı bitiş olarak alalım
  const origin = duraklar[0].coordinate;
  const destination = duraklar[2].coordinate;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={osmaniyeKoordinat}
      >
        {duraklar.map((durak) => (
          <Marker
            key={durak.id}
            coordinate={durak.coordinate}
            title={durak.title}
          >

            <Image
              source={require('../../assets/images/durak-icon.png')}
              style={{ width: 40, height: 40, resizeMode: 'contain' }} // Boyutlar buradan ayarlanıyor
            />
          </Marker>

        ))}

        {// Rota Çizimi Komponenti }
        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_APIKEY}
          strokeWidth={5} // Çizgi kalınlığı
          strokeColor="hotpink" // Çizgi rengi
        />

      </MapView>

      <Link href="/about" asChild>
        <TouchableOpacity style={styles.aboutButton}>
          <Text style={styles.aboutButtonText}>?</Text>
        </TouchableOpacity>
      </Link>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,  // Bu, haritanın tüm ekranı kaplamasını sağlar
  },
  // Buton Stilleri
  aboutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  aboutButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});
*/


import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  // Menü butonlarımızı bir dizi içinde tanımlıyoruz ki yönetmesi ve düzenlemesi kolay olsun
  const menuItems = [
    { id: '1', title: 'Hatlar', route: '/hatlar', color: '#0a9fa4' },
    { id: '2', title: 'Duraklar', route: '/duraklar', color: '#0a9fa4' },
    { id: '3', title: 'Nasıl Giderim?', route: '/nasil-giderim', color: '#0a9fa4' },
    { id: '4', title: 'Hesap', route: '/hesap', color: '#0a9fa4' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Karşılama Başlığı , şu an alt başlık yok! */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Osmaniye Ulaşım</Text>

        </View>

        {/* Menü Izgarası (Grid) - ScrollView Kullanıyoruz */}
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false} // Sağdaki kaydırma çubuğunu gizler (isteğe bağlı)
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: item.color }]}
              onPress={() => router.push(item.route as any)}
            >
              <Text style={styles.cardText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Açık gri/mavi temiz bir arka plan
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  // gridContainer yerine scrollContainer yazdık
  scrollContainer: {
    paddingBottom: 20, // En alttaki buton ekranın dibine yapışmasın diye
  },
  card: {
    width: '100%',           // 
    height: 80,         // Dikdörtgen, uzun ince
    borderRadius: 20,       // Köşeleri yuvarlat
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,   // Butonlar arası boşluk
    // Gölgelendirme (Hem iOS hem Android için)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});