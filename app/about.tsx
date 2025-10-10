import { Stack } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const AboutScreen = () => {
    const flaticonUrl = 'https://www.flaticon.com';
    const authorUrl = 'https://www.flaticon.com/authors/shohanur-rahman13';

    return (
        <SafeAreaView style={styles.container}>
            {/* Sayfa başlığını buradan ayarlıyoruz */}
            <Stack.Screen options={{ title: 'Hakkında' }} />
            <View style={styles.content}>
                <Text style={styles.title}>Uygulama Hakkında</Text>
                <Text style={styles.text}>
                    Bu uygulama React Native kullanılarak geliştirilmiştir.
                </Text>

                <Text style={styles.subtitle}>Lisanslar ve Atıflar</Text>
                <Text style={styles.attributionText}>
                    Bu uygulamada kullanılan bazı ikonlar {' '}
                    <Text style={styles.link} onPress={() => Linking.openURL(flaticonUrl)}>
                        Flaticon
                    </Text>
                    'dan alınmıştır.{' '}
                    {'\n'}
                    "Letter D" ikonu,{' '}
                    <Text style={styles.link} onPress={() => Linking.openURL(authorUrl)}>
                        shohanur.rahman13{' '}
                    </Text>
                    tarafından yapılmıştır.{' '}

                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 10,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
    },
    attributionText: {
        fontSize: 16,
        lineHeight: 24,
        marginTop: 10,
    },
    link: {
        color: '#007BFF',
        textDecorationLine: 'underline',
    },
});

export default AboutScreen;