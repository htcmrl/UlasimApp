declare namespace NodeJS {
    interface ProcessEnv {
        EXPO_PUBLIC_GOOGLE_MAPS_APIKEY: string;
        // Buraya .env dosyasındaki diğer EXPO_PUBLIC_ ile başlayan değişkenleri de ekleyebiliriz
    }
}