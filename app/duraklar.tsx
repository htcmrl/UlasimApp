import { Stack } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// JSON verimizi içeri alıyoruz
import osmaniyeData from '../data/osmaniye.json';

// Gelen verinin tam yapısını TypeScript'e öğretiyoruz (Böylece hata vermez ve kod yazarken kolaylık sağlar)
type DurakTipi = {
    stopId: string;
    name: string;
    lat: string;
    lng: string;
    routeType?: string;
};

export default function DuraklarScreen() {
    // JSON dosyasından sadece durakları (stopList) alıyoruz
    const duraklar = osmaniyeData.stopList;

    // Ekrana basılacak her bir durağın tasarımı
    const renderItem = ({ item }: { item: DurakTipi }) => (
        <TouchableOpacity style={styles.card}>
            {/* Sol taraf: Küçük bir durak ikonu/emojisi */}
            <View style={styles.iconContainer}>
                <Text style={styles.iconText}>🚏</Text>
            </View>

            {/* Sağ taraf: Durak Adı */}
            <View style={styles.nameContainer}>
                <Text style={styles.nameText}>{item.name}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.safeArea}>
            {/* ÜST BAR AYARI */}
            <Stack.Screen
                options={{
                    headerBackTitle: 'Geri', // Veya 'Ana Sayfa'
                }}
            />
            <View style={styles.container}>
                <Text style={styles.headerTitle}>Tüm Duraklar</Text>

                <FlatList
                    data={duraklar}
                    // her durağın benzersiz kimliği olarak stopId kullanıyoruz
                    keyExtractor={(item, index) => item.stopId ? item.stopId.toString() : index.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
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
        paddingBottom: 30,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        padding: 15,
        alignItems: 'center',
        // Gölgelendirme
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 40,
        height: 40,
        backgroundColor: '#E8F4F8',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 20,
    },
    nameContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});