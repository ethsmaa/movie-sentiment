-- CreateEnum
CREATE TYPE "SentimentLabel" AS ENUM ('positive', 'negative', 'neutral');

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "year" INTEGER NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "backdropUrl" TEXT,
    "overview" TEXT NOT NULL,
    "genres" TEXT[],
    "language" TEXT NOT NULL,
    "runtime" INTEGER,
    "voteAverage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_analyses" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "label" "SentimentLabel" NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "positiveProb" DOUBLE PRECISION NOT NULL,
    "negativeProb" DOUBLE PRECISION NOT NULL,
    "neutralProb" DOUBLE PRECISION NOT NULL,
    "modelVersion" TEXT NOT NULL DEFAULT 'bert-sim-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sentiment_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_sentiment_summaries" (
    "movieId" TEXT NOT NULL,
    "totalReviews" INTEGER NOT NULL,
    "positiveCount" INTEGER NOT NULL,
    "negativeCount" INTEGER NOT NULL,
    "neutralCount" INTEGER NOT NULL,
    "averageConfidence" DOUBLE PRECISION NOT NULL,
    "hypeScore" DOUBLE PRECISION NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_sentiment_summaries_pkey" PRIMARY KEY ("movieId")
);

-- CreateIndex
CREATE UNIQUE INDEX "movies_externalId_key" ON "movies"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_externalId_key" ON "reviews"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_analyses_reviewId_key" ON "sentiment_analyses"("reviewId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_analyses" ADD CONSTRAINT "sentiment_analyses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_sentiment_summaries" ADD CONSTRAINT "movie_sentiment_summaries_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
