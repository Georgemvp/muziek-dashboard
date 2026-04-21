# Cloudflare Tunnel instellingen

Dit bestand helpt je bij het instellen van Cloudflare Tunnel zodat je muziekdashboard veilig bereikbaar is van buiten je netwerk, zonder poortforwarding nodig.

---

## Voordelen

✓ **Geen poortforwarding** — geen veiligheidsrisico's
✓ **Versleuteld** — alle verkeer gaat via Cloudflare
✓ **Gratis** — Cloudflare biedt gratis tunnels
✓ **Automatisch DNS** — .cfargotunnel.com domeinen of je eigen domein

---

## Stap 1: Cloudflare account aanmaken

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com)
2. Klik **Sign Up** en volg de setup
3. Verifieer je e-mailadres
4. Je bent nu klaar!

---

## Stap 2: Een tunnel maken

### Optie A: Met je eigen domein (aanbevolen)

1. **Voeg je domein toe aan Cloudflare:**
   - Klik **Add a site** in het Cloudflare dashboard
   - Voer je domein in (bv. `muziek.jouwdomein.com`)
   - Volg de nameserver-instructies van Cloudflare

2. **Maak een tunnel:**
   - Ga naar **Zero Trust** (linkermenu)
   - Klik **Networks** → **Tunnels**
   - Klik **Create a tunnel**
   - Selecteer **Cloudflared**
   - Geef de tunnel een naam (bv. `muziekdashboard`)
   - Klik **Save tunnel**

3. **Kopieer je token:**
   - Je ziet nu een pagina met: `cloudflared service install --token "eyJhIjoiM..."`
   - Kopieer het token (de lange string tussen aanhalingstekens)
   - Plak het in je `.env` bestand als `CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiM...`

4. **Route configureren:**
   - Blijf op dezelfde pagina, scroll naar **Public hostnames**
   - Klik **Add a public hostname**
   - Vul in:
     - **Subdomain:** `muziek` (of gewenste naam)
     - **Domain:** `jouwdomein.com`
     - **Type:** `HTTP`
     - **URL:** `http://localhost` (Cloudflared bereikt poort 80)
   - Klik **Save**

### Optie B: Met gratis cfargotunnel.com domein

1. **Maak een tunnel:**
   - Ga naar **Zero Trust** → **Networks** → **Tunnels**
   - Klik **Create a tunnel**
   - Selecteer **Cloudflared**
   - Geef een naam (bv. `muziekdashboard`)
   - Klik **Save tunnel**

2. **Kopieer je token:**
   - Kopieer het token (lange string)
   - Plak in `.env`: `CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiM...`

3. **Auto-domein instellen:**
   - Op de tunnel-pagina → **Public hostnames**
   - Klik **Add a public hostname**
   - Vul in:
     - **Domain:** Laat leeg, Cloudflare genereert automatisch
     - **Type:** `HTTP`
     - **URL:** `http://localhost`
   - Je krijgt automatisch: `muziekdashboard-abc123.cfargotunnel.com`

---

## Stap 3: Beveiligde toegang instellen (optioneel maar aanbevolen)

1. **Ga naar Zero Trust → Access → Applications**
2. **Klik Add an application**
3. **Vul in:**
   - **Application name:** `Muziekdashboard`
   - **Application domain:** Je tunnel domein (bv. `muziek.jouwdomein.com`)
   - **Application type:** `Self-hosted`
4. **Klik Next**
5. **Add a policy:**
   - **Selector:** `Email`
   - **Value:** `jouw@email.com` (jouw Cloudflare account-emailadres)
   - **Action:** `Allow`
6. **Save application**

Nu is je dashboard alleen toegankelijk voor jou (via Cloudflare's login).

---

## Stap 4: Token in .env invoeren

```bash
# In .env:
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoiM0ZFNzRCNDhFRkQzQTc3MkE4Nzc5QjNCOUU0MjAyNzhkZmEzN2ViZTUxMzAxZTAyNTk2ZTA5ZjU4ZDAyNzZiNCIsInR0IjoibWlkIiwicyI6IjExMjMzNDQ1OTI0ODIzNzM5MjMiLCJhIjoiYzExZDQyZDI0N2YzZGJmMTBhN2U2OTkzODYzODQwMmQiLCJhbyI6YWxsc2lzdGFudHM=
```

**BELANGRIJK:** Dit token is geheim, deel het niet!

---

## Stap 5: Container starten

```bash
# In je project directory:
docker compose up -d
```

**Controleer of cloudflared draait:**
```bash
docker compose logs cloudflared
```

Je zou iets moeten zien als:
```
cloudflared | 2026-04-21T10:00:00Z inf | Connection established
```

---

## Stap 6: Testen

**Met eigen domein:**
```bash
curl https://muziek.jouwdomein.com
```

**Met cfargotunnel.com:**
```bash
curl https://muziekdashboard-abc123.cfargotunnel.com
```

Je dashboard moet bereikbaar zijn! 🎉

---

## Troubleshooting

### "Connection failed" in logs

- **Controleer je token:**
  ```bash
  docker compose logs cloudflared | grep -i error
  ```
- **Start opnieuw:**
  ```bash
  docker compose down
  docker compose up -d --build
  ```
- **Token vernieuwd?** Maak een nieuwe tunnel en kopieer opnieuw het token

### Dashboard geeft "502 Bad Gateway"

- **Controleer of muziekdashboard container draait:**
  ```bash
  docker compose ps
  ```
- **Restart beide containers:**
  ```bash
  docker compose restart
  ```

### "Too many redirects" in browser

- Dit betekent Cloudflare → muziekdashboard correct werkt
- **Controleer je Access policy** (Zero Trust → Access → Applications)

---

## Token verversen / Tunnel verwijderen

Als je je tunnel wilt wijzigen of verwijderen:

1. **Zero Trust → Networks → Tunnels**
2. Zoek je tunnel
3. Klik **Delete** (dit verwijdert het token)
4. Maak een nieuwe tunnel en volg stap 2-4 opnieuw

---

## Meer info

- [Cloudflare Tunnel docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Zero Trust setup](https://developers.cloudflare.com/cloudflare-one/)
- [Cloudflare pricing](https://www.cloudflare.com/plans/) (gratis opties beschikbaar)
