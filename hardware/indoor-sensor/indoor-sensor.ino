// Flarecast Indoor Sensor - ESP32 firmware
//
// Reads a DHT22, shows temperature and humidity on a 16x2 I2C LCD, and streams the
// readings to the Flarecast web app over USB serial (Web Serial API in Chrome/Edge).
//
// Libraries: "DHT sensor library" (Adafruit) + "Adafruit Unified Sensor", LiquidCrystal_I2C
//            NimBLE-Arduino 2.x (only if USE_BLE = 1)
// Board package: ESP32 Arduino core 3.x
//
// Wiring:
//   DHT22 data -> GPIO 5  (3.3V, GND, 10k pull-up to 3.3V if the module has none)
//   LCD I2C    -> SDA GPIO 21, SCL GPIO 22 (try address 0x3F if 0x27 stays blank)
//
// USB serial protocol (115200 baud, one message per line)
//   ESP32 -> app (JSON):  {"type":"ready"}                    sent once after boot
//                         {"type":"env","t":23.4,"h":41.0}    every 3 s (temp in C, humidity in %)
//   app -> ESP32 (text):  PING                                heartbeat; replies with a fresh reading

#define USE_BLE 0          // 1 = also notify readings over Bluetooth LE (optional, not used by the web app)

#include <Arduino.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#if USE_BLE
#include <NimBLEDevice.h>
#endif

// ---------- Pins ----------
#define DHTPIN   5
#define DHTTYPE  DHT22
#define I2C_SDA  21
#define I2C_SCL  22

// ---------- BLE (optional) ----------
#define SVC_UUID "12345678-1234-1234-1234-123456789abc"
#define ENV_UUID "12345678-1234-1234-1234-123456789ab1"   // read/notify, "temp,hum"

// ---------- Hardware objects ----------
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

#if USE_BLE
NimBLECharacteristic* envChar = nullptr;
#endif
bool bleConnected = false;

// ---------- State ----------
float temperature = NAN, humidity = NAN;
uint32_t lastGoodReadMs = 0;
const uint32_t SENSOR_TIMEOUT_MS = 15000;  // no good DHT reading for this long => show an error

uint32_t lastHostMs = 0;                   // last time the web app pinged us
bool hostSeen = false;
volatile bool sendEnvNow = false;

// ---------- Helpers ----------
bool usbConnected() { return hostSeen && (millis() - lastHostMs < 12000); }

void readSensor() {
  float t = dht.readTemperature();   // Celsius
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    temperature = t;
    humidity = h;
    lastGoodReadMs = millis();
  } else if (millis() - lastGoodReadMs > SENSOR_TIMEOUT_MS) {
    temperature = NAN;               // stop reporting stale values; the app marks the sensor as quiet
    humidity = NAN;
  }
}

void emitEnvSerial() {
  if (isnan(temperature) || isnan(humidity)) return;
  Serial.printf("{\"type\":\"env\",\"t\":%.1f,\"h\":%.1f}\n", temperature, humidity);
}

void updateLCD() {
  char l1[17], l2[17];
  if (isnan(temperature) || isnan(humidity)) {
    if (lastGoodReadMs == 0 && millis() < SENSOR_TIMEOUT_MS) {
      snprintf(l1, sizeof(l1), "Reading sensor..");
      snprintf(l2, sizeof(l2), " ");
    } else {
      snprintf(l1, sizeof(l1), "Sensor error");
      snprintf(l2, sizeof(l2), "Check DHT wiring");
    }
  } else {
    snprintf(l1, sizeof(l1), "Temp: %.1f%cC", temperature, (char)223);
    snprintf(l2, sizeof(l2), "Humid: %.0f%% %s", humidity,
             bleConnected ? "BLE" : (usbConnected() ? "USB" : "   "));
  }
  lcd.setCursor(0, 0); lcd.printf("%-16s", l1);
  lcd.setCursor(0, 1); lcd.printf("%-16s", l2);
}

// ---------- USB serial command parser ----------
void handleSerialLine(String line) {
  line.trim();
  if (line.length() == 0) return;
  hostSeen = true;
  lastHostMs = millis();
  if (line == "PING") sendEnvNow = true;
}

void pollSerial() {
  static String buf;
  while (Serial.available()) {
    char c = (char)Serial.read();
    if (c == '\n') { handleSerialLine(buf); buf = ""; }
    else if (c != '\r' && buf.length() < 64) buf += c;
  }
}

// ---------- BLE (optional) ----------
#if USE_BLE
class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer*, NimBLEConnInfo&) override { bleConnected = true; sendEnvNow = true; }
  void onDisconnect(NimBLEServer*, NimBLEConnInfo&, int) override {
    bleConnected = false;
    NimBLEDevice::startAdvertising();
  }
};

void setupBLE() {
  NimBLEDevice::init("IndoorTracker");
  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  NimBLEService* svc = server->createService(SVC_UUID);
  envChar = svc->createCharacteristic(ENV_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  svc->start();
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->enableScanResponse(true);
  adv->start();
}
#endif

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);

  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.print("Indoor Tracker");

  dht.begin();

#if USE_BLE
  setupBLE();
#endif

  delay(1500);       // DHT22 needs a moment after power-up
  readSensor();
  updateLCD();
  Serial.println("{\"type\":\"ready\"}");
}

// ---------- Loop ----------
void loop() {
  static uint32_t lastSample = 0, lastSerialEnv = 0;
#if USE_BLE
  static uint32_t lastBleEnv = 0;
#endif
  uint32_t ms = millis();

  pollSerial();

  // 1. Sample the sensor and refresh the LCD every 2.5 s (the DHT22 can't be read faster than ~0.5 Hz)
  if (ms - lastSample >= 2500) {
    lastSample = ms;
    readSensor();
    updateLCD();
  }

  // 2. Stream readings: USB every 3 s, BLE every 10 s, both immediately after a PING
  if (sendEnvNow || ms - lastSerialEnv >= 3000) {
    lastSerialEnv = ms;
    emitEnvSerial();
  }
#if USE_BLE
  if (bleConnected && !isnan(temperature) && (sendEnvNow || ms - lastBleEnv >= 10000)) {
    lastBleEnv = ms;
    char buf[24];
    snprintf(buf, sizeof(buf), "%.1f,%.1f", temperature, humidity);
    envChar->setValue(buf);
    envChar->notify();
  }
#endif
  sendEnvNow = false;
}


