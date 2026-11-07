# Flarecast Indoor Sensor

An optional ESP32 device that measures indoor temperature and humidity, feeds the Flare Forecast, and reminds parents to take the daily skin photo. The Flarecast app works fully without it.

## What it does

- Reads temperature and humidity from a DHT22 every 2.5 seconds and shows them on a 16x2 LCD
- Streams readings to the Flarecast web app over USB (every 3 seconds) or Bluetooth LE (every 10 seconds, optional)
- Beeps and blinks at the parent's chosen reminder time with "TAKE YOUR PHOTO!" on screen, and stops after 10 minutes or when the button is pressed
- Pressing the button tells the app to open the check-in screen

## Parts

| Part | Pin |
| --- | --- |
| ESP32 dev board | — |
| DHT22 temperature/humidity sensor | Data → GPIO 5 (3.3V, GND, 10k pull-up to 3.3V if the module has none) |
| 16x2 LCD with I2C backpack | SDA → GPIO 21, SCL → GPIO 22 (try address 0x3F if 0x27 stays blank) |
| Piezo buzzer | GPIO 26 |
| LED + 220 Ω resistor | GPIO 27 |
| Push button | GPIO 13 to GND (internal pull-up) |

## Flash the firmware

1. Install the **ESP32 Arduino core 3.x** in the Arduino IDE (Boards Manager).
2. Install libraries: **DHT sensor library** (Adafruit), **Adafruit Unified Sensor**, **LiquidCrystal_I2C**, and **NimBLE-Arduino 2.x** (only needed if `USE_BLE` is 1).
3. Open `indoor-sensor.ino`, select your ESP32 board and port, and upload.
4. Set `#define USE_BLE 1` at the top to turn on Bluetooth; leave it at 0 for USB only.

## Connect it to the Flarecast app

`useIndoorSensor.ts` is a React hook that talks to the device through the **Web Serial API** (Chrome or Edge on desktop; not supported on phones or Safari).

1. The hook lives at `src/hooks/useIndoorSensor.ts` and is already wired into the Indoor Sensor card in `src/components/ForecastSection.tsx`.
2. Use it on the Forecast screen:

```tsx
const sensor = useIndoorSensor({ onCheckInPrompt: () => setScreen("check-in") });

<button onClick={sensor.connect}>Connect indoor sensor</button>
{sensor.reading && (
  <p>
    Nursery: {sensor.reading.t}°C · {sensor.reading.h}% humidity
    {sensor.isDryAir && " — dry air tonight"}
  </p>
)}
```

3. After a check-in is saved, call `sensor.acknowledge()` to silence the device alarm.
4. Feed `sensor.reading.h` into the forecast: humidity under 30% (`DRY_AIR_THRESHOLD`) raises flare risk.

If no device is connected, keep using the simulated indoor readings so the demo still works.

## Serial protocol (115200 baud, one message per line)

| Direction | Message | Meaning |
| --- | --- | --- |
| Device → app | `{"type":"ready"}` | Device booted |
| Device → app | `{"type":"env","t":23.4,"h":41.0}` | Temperature (°C) and humidity (%) |
| Device → app | `{"type":"status","event":"ALARM_ON"}` | Reminder alarm started (`ALARM_OFF`, `BTN` also possible) |
| App → device | `TIME <local epoch seconds>` | Sync the clock |
| App → device | `SCHED <minutes after midnight>` | Set the daily reminder (e.g. `SCHED 1200` = 8:00 pm) |
| App → device | `ACK` | Stop the alarm |
| App → device | `PING` | Heartbeat; device replies with a fresh reading |
