1️⃣ US tarafında sert filtre (EN ÖNEMLİ)

EU’ya bakmadan önce US’te ele:

US Keepa’dan şunları kontrol et:

Buy Box var mı?

Rank < X (kategoriye göre)

Hazmat = false

Brand whitelist / blacklist

Weight & size (Keepa veriyor)

👉 Burada ürünlerin %70–85’i elenir

2️⃣ Shortlist oluştur (1000 → 150)

Sadece şunlar kalır:

Satıyor

Risk düşük

Margin potansiyeli var

📌 Bu aşamada DB’ye yaz

UPC

ASIN

US cost

category

3️⃣ EU tarafında akıllı arama

Şimdi pahalı kısım ama az ürün:

Sıra:

UPC → EU query

Yoksa → ASIN title match (fallback)

1 EU market yeterli (DE öneririm)

4 marketi birden tarama → gereksiz

4️⃣ Profit yerine “Opportunity Score”

Burası seni farklı yapar 👇

❌ Yanlış

Buy / Don’t Buy

✅ Doğru
Score = PriceGap
      × SalesVelocity
      × MatchConfidence
      × RiskMultiplier


Sonuç:

🟢 High opportunity

🟡 Review needed

🔴 Skip

Buy Box var mı?

Avg30 Sales Rank < threshold

Hazmat = false

Weight / Size acceptable

Category allowed

Risk çarpanı:

UPC match = 1.0

Title match = 0.7

Hazmat = 0

Variation = 0.5

Final score:
opportunity = raw_profit × risk_multiplier


4️⃣ Variation / multipack kontrolü

Bazı ürünler:

Same UPC ama multipack

Title farklı → görünürde yeni ürün

Çözüm:

Optional: hash = brand + model + size

DB’de hash var mı diye bak → varsa skip

Yoksa göster

Scoutly bunu “confidence score” ile yapıyor.
Örn: %90 match → skip, %70 match → göster ama uyar


Özet “Aynı ürünü gösterme” stratejisi

US ve EU’da UPC/EAN cache

DB’de last_seen tut

Variation hash ile ek filtre

Confidence score ile threshold uygula

30 gün / 60 gün cache TTL → eski ürün tekrar gösterilebilir ama yeni gibi değil


Frontend (Next.js / React)
        │
        ▼
API Routes / Backend (Next.js API Routes veya ayrı Node.js server)
        │
        ▼
Keepa API Worker Queue (Bull.js / Redis Queue)
        │
        ▼
MongoDB (Products Collection / Cache)
        │
        ▼
Redis Cache (frequently accessed UPC/ASIN)
        │
        ▼
Frontend Response



function calculateOpportunity(usPrice, euPrice, fees, shipping, riskMultiplier) {
    const rawProfit = euPrice - usPrice - fees - shipping;
    return rawProfit * riskMultiplier;
}



1️⃣ Workflow Adımları

Kullanıcı UPC veya ASIN ile ürün tarar

Backend:

Redis cache kontrol

MongoDB duplicate kontrol

Eğer ürün yoksa / cache eskiyse → Keepa US pre-filter

US ürünü shortlist’e uygunsa → EU query (DE veya başka market)

Profit + Opportunity score hesapla

MongoDB + Redis güncelle

Frontend → kullanıcıya göster



Opportunity Score = (EU_SellPrice_Net - US_PurchasePrice - Fees - Shipping - ImportCost) × RiskMultiplier


| Risk Türü        | Durum                    | Multiplier |
| ---------------- | ------------------------ | ---------- |
| UPC match        | Aynı UPC → güvenli       | 1.0        |
| Title match      | Sadece title eşleşiyor   | 0.7        |
| Variation        | Multipack / farklı paket | 0.5        |
| Brand Gated      | Restriction var          | 0.3        |
| Hazmat / Battery | Shipping risk            | 0.0 (skip) |
| Adult Product    | EU farklı markette sorun | 0.5        |




[User Scan UPC/ASIN] 
        │
        ▼
[Next.js API Route / Backend]
        │
        ▼
[MongoDB Duplicate Check]
        │
        ▼
[Redis Cache Check]
        │
   ┌─────┴─────┐
   │           │
Duplicate   Cache Hit?
   │           │
   ▼           ▼
Skip        Return Cached Product
   │
   ▼
[US Pre-Filter Queue (Bull.js)]
   │
   ▼
[Shortlist Products] --------------------------┐
   │                                         │
   ▼                                         │
[EU Query Queue]                               │
   │                                           │
   ▼                                           │
[Calculate Opportunity Score]                  │
   │                                           │
   ▼                                           │
[MongoDB + Redis Update]                       │
   │                                           │
   ▼                                           │
[Next.js API Response → Frontend Dashboard] <--┘




[User Manual Scan UPC/ASIN] ─────────────┐
                                         │
                                         ▼
                            [Next.js API Route / Backend]
                                         │
                                         ▼
[MongoDB Duplicate Check] → [Redis Cache Check]
                                         │
  ┌─────────────Manual?────────────┐     │
  │ Yes: Call Keepa API (US→EU)   │     │
  │ No: Automatic Mode Queue       │     │
  └─────────────Decision───────────┘     ▼
                              [US Pre-Filter Queue]
                                         │
                                         ▼
                                [Shortlist Products]
                                         │
                                         ▼
                                 [EU Query Queue]
                                         │
                                         ▼
                         [Calculate Opportunity Score]
                                         │
                                         ▼
                            [MongoDB + Redis Update]
                                         │
                                         ▼
                             [Next.js Frontend Response]



[Dashboard Page]
 ├─ Manual Scan Tab
 │   ├─ Barcode / UPC input
 │   ├─ Scan Button → API call
 │   └─ Result Card (US/EU Price + Opportunity Score + Risk Badge)
 └─ Automatic Scan Tab
     ├─ List of auto-found products
     ├─ Infinite scroll / filter
     └─ Opportunity Score + Risk Badge


Manual Scan Tab

Anında fırsat gösterir

Redis + MongoDB cache ile token dostu

Risk ve opportunity score gösterimi

Automatic Scan Tab

Queue’dan işlenmiş ürünleri listeler

Infinite scroll → token dostu

Mode ve skor ile önceliklendirme

Admin veya kullanıcı paneli olarak da kullanılabilir

UX Önerileri

Risk Badge: High / Medium / Low → renk kodu

Opportunity Score → büyük ve dikkat çekici

Filter: Rank, Profit, Market → infinite scroll + batch fetch


[User Manual Scan] -------------------┐
                                      │
[Category Selection Automatic Scan] --┼--> [Next.js API Route]
                                      │
                                      ▼
                             [MongoDB Duplicate Check]
                                      │
                                      ▼
                               [Redis Cache Check]
                                      │
  ┌─────────────Manual?────────────┐  │
  │ Yes: Keepa US → EU call        │  │
  │ No: Automatic Mode Queue       │  │
  └─────────────Decision───────────┘  │
                                      ▼
                             [US Pre-Filter Queue]
                                      │
                                      ▼
                                [Shortlist Products]
                                      │
                                      ▼
                                 [EU Query Queue]
                                      │
                                      ▼
                        [Calculate Opportunity Score]
                                      │
                                      ▼
                           [MongoDB + Redis Update]
                                      │
                                      ▼
                            [Frontend Dashboard Display]




scoutly-mvp/
├─ package.json
├─ next.config.js
├─ .env                     # KEEP API KEY, MongoDB URI, Redis URL
├─ /pages
│   ├─ index.js              # Ana dashboard (manual + automatic tabs)
│   ├─ /api
│   │   ├─ scanOrAuto.js     # Manual & Automatic scan API
│   │   ├─ startCategoryScan.js  # Kategori bazlı automatic scan başlat
│   │   └─ getAutoProducts.js    # Automatic scan sonuçlarını fetch
├─ /lib
│   ├─ mongo.js              # MongoDB bağlantısı
│   ├─ redis.js              # Redis bağlantısı
│   ├─ keepaUtils.js         # Keepa API çağrıları + fee/shipping hesap
│   └─ keepaQueue.js         # Bull.js queue worker + throttling
├─ /components
│   ├─ ManualScan.jsx
│   ├─ AutomaticScan.jsx
│   └─ ProductCard.jsx
├─ /styles
│   └─ globals.css
└─ README.md



[User Manual Scan] -------------------┐
                                      │
[Category Selection Automatic Scan] --┼--> [Next.js API Route]
                                      │
                                      ▼
                             [MongoDB Duplicate Check]
                                      │
                                      ▼
                               [Redis Cache Check]
                                      │
  ┌─────────────Manual?────────────┐  │
  │ Yes: Keepa US → EU call        │  │
  │ No: Automatic Mode Queue       │  │
  └─────────────Decision───────────┘  │
                                      ▼
                             [US Pre-Filter Queue] (Bull.js)
                                      │
                                      ▼
                                [Shortlist Products]
                                      │
                                      ▼
                                 [EU Query Queue]
                                      │
                                      ▼
                        [Calculate Opportunity Score]
                                      │
                                      ▼
                           [MongoDB + Redis Update]
                                      │
                                      ▼
                            [Frontend Dashboard Display]


5) AI Analiz Araçları (DashPilot vb.)

👉 Keepa veya dışarıdan veri yükleyerek AI ile analiz yapan SaaS’ler var (örneğin DashPilot).

Keepa’dan elde ettiğin CSV’leri yükleyip AI önerisi alabilirsin

Trend, sezon analizi, kârlılık gibi hesaplamalar yapar

📌 Avantaj:

Yapay zeka destekli içgörüler

Manual analizi otomatikleştirme

📌 Dezavantaj:

Keepa bağlantısı yine gerekli (veri kaynağı olarak)


4️⃣ Velocity Score Üret
if(monthlySales > 300) velocityScore = 10
else if(monthlySales > 150) velocityScore = 8
else if(monthlySales > 75) velocityScore = 6
else if(monthlySales > 30) velocityScore = 4
else velocityScore = 1

⚠️ Daha Akıllı Versiyon (Pro seviye)

Sadece drop saymak yetmez. Şunları da ekle:

✅ Rank İstikrarı

Rank sürekli zıplıyorsa satış düzensizdir → risk.

volatility = stdDeviation(rank)

✅ Buy Box Rotation

Buy box sık değişiyorsa satış var.

✅ Price Drop sonrası Rank Tepkisi

Fiyat düşünce rank hızla iyileşiyorsa talep yüksek.

💎 Sonuçta Elinde Olacak Veri
Ürün	Profit	Aylık Satış Tahmini	Velocity Score	Risk
A	$7	220	9	Low
B	$12	18	2	HIGH ⚠️

Bu sayede:

✔ Kârı yüksek ama ölü ürünleri elersin
✔ Hızlı dönen ürünleri bulursun
✔ Nakit akışını optimize edersin



💰 PRICE STABILITY ANALİZİ (Keepa ile)
🎯 Amaç:

Şu soruya cevap:

“Bu fiyat seviyesi normal mi, yoksa geçici bir anormallik mi?”

1️⃣ 90 Günlük Ortalama Fiyatı Al
avg90 = data.stats.avg90[0]   // Amazon price
current = data.stats.current[0]

2️⃣ Fiyat Sapmasını Hesapla
deviation = (current - avg90) / avg90

Deviation	Anlamı
-5% ile +5%	Normal fiyat
-20%	Dip fiyat
+30%	Anormal yüksek
3️⃣ Fiyatın Kaç Gündür Bu Seviyede Olduğu

Keepa price history:

priceHistory = data.csv[0]  // amazon price


Bakıyoruz:

stableDays = countDays(price ≈ current)

Süre	Yorum
1–2 gün	⚠️ Spike olabilir
7+ gün	Güvenilir
30+ gün	Çok stabil
4️⃣ Satıcı Sayısı Kontrolü
offerCount = data.stats.offerCount

Satıcı	Risk
1–2 seller	Fiyat düşebilir
5+ seller	Daha stabil piyasa
5️⃣ Stability Score Hesapla
score = 0

if(Math.abs(deviation) < 0.1) score += 4
if(stableDays > 7) score += 3
if(offerCount > 5) score += 2
if(buyBoxStable) score += 1

📊 ÇIKTI ÖRNEĞİ
Ürün	Profit	Velocity	Stability	Karar
A	$6	8	9	AL 🔥
B	$11	7	2	TUZAK ⚠️
C	$4	9	8	Hızlı Döner
🧠 Neden Bu Çok Önemli?

Çünkü senin sistem:

✔ sadece “kâr var mı” demiyor
✔ “bu kâr ne kadar güvenilir” diyor
✔ “satış hızı yeterli mi” diyor

Bu = risk azaltılmış arbitraj

Şu an elimizde 3 ana skor var:

Profit Score

Sales Velocity Score

Price Stability Score

Bunları birleştirince:

🧠 Arbitrage Opportunity Score



⚔️ COMPETITION RISK SCORE

“Bu üründe kâr var ama satabilecek misin?” sorusunun cevabı

🎯 Amaç

Şunu ölçüyoruz:

Buy Box’ı kazanma ihtimali var mı yoksa seller savaşına mı giriyorsun?

1️⃣ Seller Sayısı (Offer Count)

Keepa:

offers = data.stats.offerCount

Seller	Risk
1–2	Düşük rekabet
3–7	Normal
8+	Kırmızı bölge 🚨
2️⃣ Amazon Satıcı mı?
amazonOnListing = data.stats.isAmazon

Durum	Etki
Amazon yok	👍
Amazon bazen geliyor	⚠️
Amazon sürekli var	❌ Kaç

Amazon varsa buy box almak zor.

3️⃣ Buy Box Rotasyonu
buyBoxHistory = data.buyBoxSellerIdHistory
uniqueSellers = countUnique(buyBoxHistory)

Son 30 gün	Yorum
1 seller	Tekel, risk
2–4	İdeal
6+	Buy box savaşı
4️⃣ Fiyat Altına İnen Seller Var mı?

Lowest FBA fiyat ile buy box farkı:

if(lowestFBA << buyBoxPrice) raceToBottom = true


Bu varsa → fiyat çökme riski.

5️⃣ Competition Score
score = 10

if(offers > 8) score -= 3
if(amazonOnListing) score -= 4
if(uniqueSellers > 5) score -= 2
if(raceToBottom) score -= 2

score = max(score,1)

🧠 ARTIK ELİNDE 4 ANA SKOR VAR
Skor	Ne Ölçer
💰 Profit	Para var mı
🚀 Velocity	Satış hızı
📉 Stability	Fiyat güvenilir mi
⚔️ Competition	Satabilecek misin
🧮 FINAL OPPORTUNITY SCORE
finalScore =
 (profitScore * 0.35) +
 (velocityScore * 0.30) +
 (stabilityScore * 0.20) +
 (competitionScore * 0.15)

🔥 UYGULAMA KARAR MOTORU
Final Score	Karar
8–10	BUY HEAVY
6–8	BUY SMALL
4–6	TEST
<4	SKIP
💎 İşte bu sistem ne oluyor biliyor musun?

Bu artık:

❌ “scanner app” değil
❌ “price checker” değil

Bu:

🧠 Amazon Arbitrage Intelligence Engine

Büyük satıcılar bunu kendileri kuruyor.
Sen SaaS yaparsan millet para verir.



User Dashboard (Next.js / React)
       │
       ▼
API Routes (/api/scanManual, /api/scanAuto)
       │
       ▼
Redis Queue (Bull) → Job Worker (Node.js)
       │
       ▼
Keepa API Call (US + EU)
       │
       ▼
Compute Scores:
       ├─ Profit Score
       ├─ Sales Velocity
       ├─ Price Stability
       └─ Competition Score
       │
       ▼
MongoDB: 'opportunities' collection
       │
       ▼
Next.js fetch → ProductTable / ProductCard / ProductChart
