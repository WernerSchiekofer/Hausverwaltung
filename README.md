# Hausverwaltung

Progressive Web App zur lokalen Verwaltung eines Zweifamilienhauses. Die App verwendet HTML, CSS und Vanilla JavaScript ohne Frameworks oder Build-Schritt.

## Funktionsumfang

- Dashboard mit den beiden Wohneinheiten und einer Kostenuebersicht
- Strom- und Wasserzaehler mit Vorwert, aktuellem Stand, Tarif und Grundpreis
- Ablesehistorie je Zaehler
- Einzelne Nebenkosten mit Monats- oder Jahresbetrag
- Umlage je Nebenkostenposten nach Wohnflaeche oder vollstaendig auf EG beziehungsweise OG
- Transparente Jahresabrechnung mit Einzelposten, Anteilen je Wohnung und Druck-/PDF-Ansicht
- Speicherung im Local Storage des verwendeten Browsers
- Installierbare und offline nutzbare PWA mit Service Worker

## Hausdaten und Umlage

| Einheit | Wohnflaeche | Anteil nach Wohnflaeche |
| --- | ---: | ---: |
| Erdgeschoss (EG) | 127 m² | 55,70 % |
| Obergeschoss (OG) | 101 m² | 44,30 % |
| Gesamt | 228 m² | 100 % |

Der Flaechenschluessel wird aus der Wohnflaeche berechnet: Wohnflaeche der Einheit geteilt durch 228 m². Bei jedem Nebenkostenposten kann alternativ die vollstaendige Zuordnung zu EG oder OG ausgewaehlt werden.

Strom- und Wasserverbrauch werden anhand der jeweiligen Zaehlerstaende dem EG oder OG direkt zugerechnet. Der Grundpreis wird ebenfalls direkt dem zugehoerigen Zaehler zugeordnet. Die Kostenverteilung zeigt diese Betraege getrennt von den Nebenkosten.

## Bedienung

1. Unter **Stromzaehler** oder **Wasserzaehler** pro Einheit den vorherigen und aktuellen Stand sowie den Tarif eintragen und speichern.
2. Unter **Nebenkosten** Bezeichnung, Betrag und Zeitraum fuer jeden Posten separat erfassen.
3. Fuer jeden Posten den Umlageschluessel **Nach Wohnflaeche**, **Vollstaendig dem EG zuordnen** oder **Vollstaendig dem OG zuordnen** auswaehlen.
4. Unter **Kostenverteilung** die Einzelbetraege und Jahressummen beider Wohnungen pruefen. **Abrechnung drucken / PDF** oeffnet den Druckdialog des Browsers.

Monatliche Nebenkosten werden fuer die Jahresuebersicht mit 12 multipliziert. Zaehlerkosten basieren auf der Differenz zwischen aktuellem und vorherigem Stand. Fuer einen aussagekraeftigen Jahresbetrag sollten die eingegebenen Staende den gewuenschten Abrechnungszeitraum abdecken.

## Lokal starten

Die App muss ueber HTTP oder HTTPS bereitgestellt werden. Beim direkten Oeffnen von `index.html` mit `file://` funktionieren ES-Module und Service Worker nicht zuverlaessig.

Zum Beispiel mit Python im Projektordner:

```bash
python3 -m http.server 4173
```

Anschliessend `http://localhost:4173` im Browser oeffnen. `localhost` gilt fuer Service Worker als sicherer Kontext.

## Vercel-Deployment

Das Projekt ist eine statische Website und benoetigt keinen Build-Schritt.

- Root Directory: Projektstamm mit `index.html`
- Framework Preset: **Other**
- Build Command: leer
- Install Command: leer
- Output Directory: `.`

Bei Verbindung mit GitHub kann Vercel nach jedem Push auf den konfigurierten Branch automatisch deployen. Vercel liefert die Website ueber HTTPS aus, wodurch Installation und Service Worker verfuegbar sind.

## Datenschutz und Grenzen

Zaehlerstaende und Nebenkosten werden ausschliesslich im Local Storage des aktuellen Browsers gespeichert. Es gibt keine Benutzerkonten, keinen Server-Speicher und keine Synchronisierung zwischen Geraeten. Wenn Browserdaten geloescht werden, koennen auch die gespeicherten App-Daten verloren gehen.

Die Mieteransicht ist eine druckbare Kostenaufstellung, die weitergegeben werden kann. Ein eigener Online-Zugang fuer Mieter mit gemeinsam synchronisierten Daten ist nicht enthalten und wuerde ein Backend erfordern.

Die angezeigte Kostenverteilung folgt den in der App hinterlegten Schluesseln. Ob ein Umlageschluessel fuer einen konkreten Mietvertrag und Abrechnungszeitraum zulaessig ist, muss separat geprueft werden.

## Projektstruktur

```text
index.html
style.css
app.js
manifest.json
sw.js
modules/
  dashboard.js
  strom.js
  wasser.js
  nebenkosten.js
  verteilung.js
assets/
  background.jpg
  icon.svg
```
