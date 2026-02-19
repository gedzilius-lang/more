# NFC Tag Setup

## Encoding
Write NDEF URI record:
```
https://more.peoplewelike.club/more/<username>
```

Tools: NFC Tools (iOS/Android), TagWriter by NXP
Tag type: NTAG213/215/216

## QR
Each card: /more/:username/qr → SVG QR
Dashboard QR tab shows it and offers SVG download.

## Tap behavior
iOS Safari and Android Chrome open URL directly. No app install needed.
