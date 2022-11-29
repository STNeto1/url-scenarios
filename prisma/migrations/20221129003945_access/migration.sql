-- CreateTable
CREATE TABLE "UrlAccess" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UrlAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UrlAccess" ADD CONSTRAINT "UrlAccess_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "Url"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
