-- CreateTable
CREATE TABLE "profiles" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "sex" TEXT,
    "weight_kg" DECIMAL(65,30),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drinks" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_id" BIGINT NOT NULL,
    "amount_ml" DECIMAL(65,30),
    "type" TEXT,

    CONSTRAINT "drinks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "drinks" ADD CONSTRAINT "drinks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
