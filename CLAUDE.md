# Proje: Global Sinema - AI Duygu Analizi Platformu

## 1. Proje Amacı ve Kapsamı

Bu proje, küresel ölçekteki tüm filmler için yapılmış izleyici yorumlarını analiz eden akademik düzeyde bir yapay zeka (Sentiment Analysis) platformudur. Projenin ana odak noktası, bir login veya e-ticaret sistemi kurmak değil; Kaggle üzerinden sağlanan geniş çaplı film yorumu veri setlerini BERT (Bidirectional Encoder Representations from Transformers) modeli kullanarak işlemek ve bu duygu analizi sonuçlarını (Pozitif, Negatif, Nötr dağılımları, Güven Skoru/Confidence Score) arayüzde profesyonelce görselleştirmektir.

## 2. Teknoloji Yığını (Tech Stack)

Ajanlar sadece aşağıdaki teknolojileri kullanarak geliştirme yapmalıdır:

- **Frontend:** React (Vite), TypeScript.
- **UI/UX ve Stil:** Tailwind CSS, shadcn/ui (Radix UI temelinde), Lucide Icons. HTML içi inline CSS kesinlikle yasaktır.
- **State Management:** Zustand.
- **Backend:** Hono.js (Edge-ready) + tRPC (Tamamen Type-safe iletişim için).
- **Veritabanı:** PostgreSQL + Prisma ORM (Analiz edilmiş verileri önbelleğe almak için).
- **Veri Kaynağı:** Kaggle Mock JSON verileri.

## 3. Mimari ve Geliştirme Kuralları (Everything Claude Code Entegrasyonu)

Bu proje "Everything Claude Code" ajan sistemi tarafından işlenecektir. Aşağıdaki hook ve kurallar aktiftir:

- **TypeScript Katılığı:** Backend ve Frontend arasında `tRPC` ile veri taşınırken `typescript-reviewer` yeteneğini kullanarak katı tip kontrolleri (Zod schema validation) yap. Herhangi bir `any` tipi kullanımı yasaktır.
- **Tasarım Otonomisi (`frontend-design` & `ui-ux-pro-max-skill`):** Renk paletini ve tipografiyi ajan belirleyecektir. Beklenti; modern, karanlık mod (dark mode) ağırlıklı, premium sinema hissi veren, shadcn/ui komponentlerinin yumuşak mikro-animasyonlarla harmanlandığı, veriyi ön plana çıkaran profesyonel bir arayüzdür.
- **MCP ve Context Limitleri:** Sadece PostgreSQL/Prisma ve dosya okuma (Kaggle JSON) için gerekli MCP'ler kullanılmalıdır. Proje bağlamını korumak için gereksiz tüm dış entegrasyonları devre dışı bırak.

## 4. Temel Özellikler ve "Bitti Tanımı" (Definition of Done)

Aşağıdaki modüller eksiksiz olarak inşa edilmeden süreç tamamlanmış sayılmaz:

1.  **Global Film Listeleme Ekranı:** Veritabanındaki filmlerin poster/isim ile modern bir grid yapısında listelenmesi.
2.  **Duygu Analizi (Sentiment Analysis) Dashboard'u:**
    - Bir filme tıklandığında tRPC üzerinden Hono'ya istek atılacak.
    - Hono, ilgili filmin yorumlarını Kaggle datasından çekip BERT analiz sürecinden (simüle edilmiş veya gerçek) geçirecek.
    - Sonuçlar ekranda "Hype Metresi" (genel duygu barı), "AI Confidence Score" (Modelin karar verme güven skoru) ve "Dağılım Grafikleri" (Pozitif/Negatif) olarak gösterilecek.
3.  **Örnek Yorum Etiketleri:** AI modelinin analiz ettiği en pozitif ve en negatif yorumlar, yanlarında BERT'in atadığı duygu etiketleri ile birlikte sergilenecek.

## 5. Sistem Promptu ve AI Modeli Simülasyonu

Eğer yerel bir BERT modeli ayağa kaldırılamıyorsa, Hono backend içerisinde analiz fonksiyonu şu kurallara göre JSON döndürecektir:

- Her bir yorum için metin (text), duygu (label: positive/negative/neutral) ve güven aralığı (confidence_score: 0.00 - 1.00) üretilmelidir.
- Duygu analiz sonuçları bilimsel metrikler göz önünde bulundurularak (örneğin uç noktalardaki yorumların daha yüksek confidence skoru alması gibi) mantıklı bir dağılımda olmalıdır.
