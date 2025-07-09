const THINGSPEAK_API_KEY = 'HNKLMSL35F399CTL';
const THINGSPEAK_CHANNEL_ID = '2739461'; // You may need to adjust this based on your channel

export interface ThingSpeakData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  soilMoisture: number;
  soilPH: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

export const fetchThingSpeakData = async (): Promise<ThingSpeakData | null> => {
  try {
    const response = await fetch(
      `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_API_KEY}&results=1`
    );
    
    if (!response.ok) {
      console.warn(`ThingSpeak API returned status ${response.status}. Using mock data instead.`);
      return getMockThingSpeakData();
    }
    
    const data = await response.json();
    
    if (data.feeds && data.feeds.length > 0) {
      const feed = data.feeds[0];
      return {
        nitrogen: parseFloat(feed.field1) || 0,
        phosphorus: parseFloat(feed.field2) || 0,
        potassium: parseFloat(feed.field3) || 0,
        soilMoisture: parseFloat(feed.field4) || 0,
        soilPH: parseFloat(feed.field5) || 0,
        temperature: parseFloat(feed.field6) || 0,
        humidity: parseFloat(feed.field7) || 0,
        timestamp: feed.created_at
      };
    }
    
    console.warn('No data feeds found in ThingSpeak response. Using mock data instead.');
    return getMockThingSpeakData();
  } catch (error) {
    console.warn('ThingSpeak API unavailable. Using mock data for demonstration:', error);
    return getMockThingSpeakData();
  }
};

// Mock data for demonstration when API is not available
export const getMockThingSpeakData = (): ThingSpeakData => ({
  nitrogen: 45.2,
  phosphorus: 23.8,
  potassium: 156.4, // Now consistently in mg/kg
  soilMoisture: 68.5,
  soilPH: 6.8,
  temperature: 24.3,
  humidity: 72.1,
  timestamp: new Date().toISOString()
});