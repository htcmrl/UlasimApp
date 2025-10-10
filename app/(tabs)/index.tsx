
// light: #A1CEDC  dark: #1D3D47  açık yeşil #B2D8B2  koyu mavi #1D3D47


import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';


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

